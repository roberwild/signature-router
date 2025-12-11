package com.singularbank.signature.routing.infrastructure.filter;

import com.singularbank.signature.routing.application.service.HashService;
import com.singularbank.signature.routing.application.service.IdempotencyService;
import com.singularbank.signature.routing.domain.exception.IdempotencyKeyConflictException;
import com.singularbank.signature.routing.domain.model.entity.IdempotencyRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

/**
 * Filter for idempotency enforcement on POST requests.
 * Story 10.5: Idempotency Functional
 * 
 * <p>Process:
 * <ol>
 *   <li>Extract Idempotency-Key header (auto-generate if missing)</li>
 *   <li>Calculate request hash (SHA-256 of request body)</li>
 *   <li>Check for duplicate using IdempotencyService</li>
 *   <li>If duplicate and hash matches: return cached response</li>
 *   <li>If duplicate and hash differs: return HTTP 409 Conflict</li>
 *   <li>If new: process request and cache response</li>
 * </ol>
 * </p>
 * 
 * @since Story 10.5
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyFilter extends OncePerRequestFilter {
    
    private static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
    private static final String IDEMPOTENT_REPLAY_HEADER = "X-Idempotent-Replay";
    
    private final IdempotencyService idempotencyService;
    private final HashService hashService;
    private final ObjectMapper objectMapper;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply to POST /api/v1/signatures
        if (!"POST".equals(request.getMethod()) || 
            !request.getRequestURI().matches("/api/v1/signatures/?")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Wrap request to read body multiple times
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        
        try {
            // Get or generate idempotency key
            String idempotencyKey = requestWrapper.getHeader(IDEMPOTENCY_KEY_HEADER);
            if (idempotencyKey == null || idempotencyKey.isBlank()) {
                // Auto-generate key if missing
                idempotencyKey = UUID.randomUUID().toString();
                log.debug("Auto-generated idempotency key: {}", idempotencyKey);
            }
            
            // Calculate request hash
            String requestHash = calculateRequestHash(requestWrapper);
            
            // Check for duplicate
            Optional<IdempotencyRecord> cachedRecord;
            try {
                cachedRecord = idempotencyService.checkAndStore(idempotencyKey, requestHash);
            } catch (IdempotencyKeyConflictException e) {
                // Key conflict: same key, different request body
                log.warn("Idempotency key conflict: key={}", idempotencyKey);
                responseWrapper.setStatus(HttpStatus.CONFLICT.value());
                responseWrapper.setContentType("application/json");
                String errorResponse = String.format(
                    "{\"error\":\"Idempotency key reused with different request\",\"errorCode\":\"IDEMPOTENCY_KEY_CONFLICT\"}"
                );
                responseWrapper.getWriter().write(errorResponse);
                responseWrapper.copyBodyToResponse();
                return;
            }
            
            if (cachedRecord.isPresent()) {
                // Duplicate request: return cached response
                IdempotencyRecord record = cachedRecord.get();
                log.info("Idempotency replay: key={}, originalStatus={}", 
                    idempotencyKey, record.getStatusCode());
                
                responseWrapper.setStatus(record.getStatusCode());
                responseWrapper.setContentType("application/json");
                responseWrapper.setHeader(IDEMPOTENT_REPLAY_HEADER, "true");
                responseWrapper.getWriter().write(record.getResponseBody());
                responseWrapper.copyBodyToResponse();
                return;
            }
            
            // New request: proceed with normal processing
            filterChain.doFilter(requestWrapper, responseWrapper);
            
            // Cache response if successful (2xx)
            int status = responseWrapper.getStatus();
            if (status >= 200 && status < 300) {
                String responseBody = new String(
                    responseWrapper.getContentAsByteArray(), 
                    StandardCharsets.UTF_8
                );
                
                idempotencyService.storeResponse(
                    idempotencyKey,
                    requestHash,
                    status,
                    responseBody
                );
                
                log.debug("Idempotency record stored: key={}, status={}", idempotencyKey, status);
            }
            
        } finally {
            responseWrapper.copyBodyToResponse();
        }
    }
    
    /**
     * Calculate SHA-256 hash of request body.
     * 
     * @param request Request wrapper
     * @return SHA-256 hash as hexadecimal string
     */
    private String calculateRequestHash(ContentCachingRequestWrapper request) {
        byte[] bodyBytes = request.getContentAsByteArray();
        if (bodyBytes == null || bodyBytes.length == 0) {
            return hashService.sha256("{}"); // Empty JSON object
        }
        
        try {
            // Parse JSON to normalize (handle whitespace differences)
            Object bodyObject = objectMapper.readValue(bodyBytes, Object.class);
            return hashService.sha256(bodyObject);
        } catch (Exception e) {
            log.warn("Failed to parse request body as JSON, using raw bytes: {}", e.getMessage());
            // Fallback: hash raw bytes
            return hashService.sha256(new String(bodyBytes, StandardCharsets.UTF_8));
        }
    }
}

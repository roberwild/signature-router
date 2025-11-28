package com.bank.signature.infrastructure.filter;

import com.bank.signature.infrastructure.adapter.outbound.idempotency.IdempotencyRecord;
import com.bank.signature.infrastructure.adapter.outbound.idempotency.IdempotencyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Filter for idempotency enforcement on POST requests.
 * Story 2.10: Idempotency Enforcement
 * 
 * Process:
 * 1. Check if request has Idempotency-Key header
 * 2. If key exists in DB, return cached response (HTTP 200)
 * 3. If not, proceed with request and cache response
 * 4. Add X-Idempotent-Replay header on replays
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyFilter extends OncePerRequestFilter {
    
    private static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
    private static final String IDEMPOTENT_REPLAY_HEADER = "X-Idempotent-Replay";
    
    private final IdempotencyRepository idempotencyRepository;
    
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
        
        // Get Idempotency-Key header
        String idempotencyKey = request.getHeader(IDEMPOTENCY_KEY_HEADER);
        
        // Require Idempotency-Key for POST requests
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing Idempotency-Key header\"}");
            return;
        }
        
        // Check if idempotency key already exists
        Optional<IdempotencyRecord> existingRecord = idempotencyRepository.findById(idempotencyKey);
        
        if (existingRecord.isPresent()) {
            // Replay: return cached response
            IdempotencyRecord record = existingRecord.get();
            
            log.info("Idempotency replay: key={}, originalStatus={}", 
                idempotencyKey, record.getStatusCode());
            
            response.setStatus(HttpStatus.OK.value()); // Always 200 for replays
            response.setContentType("application/json");
            response.setHeader(IDEMPOTENT_REPLAY_HEADER, "true");
            response.getWriter().write(record.getResponseBody());
            return;
        }
        
        // New request: proceed and cache response
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        
        try {
            filterChain.doFilter(request, responseWrapper);
            
            // Cache response if successful (2xx)
            int status = responseWrapper.getStatus();
            if (status >= 200 && status < 300) {
                String responseBody = new String(
                    responseWrapper.getContentAsByteArray(), 
                    StandardCharsets.UTF_8
                );
                
                IdempotencyRecord record = IdempotencyRecord.builder()
                    .idempotencyKey(idempotencyKey)
                    .statusCode(status)
                    .responseBody(responseBody)
                    .build();
                
                idempotencyRepository.save(record);
                
                log.info("Idempotency key cached: key={}, status={}", 
                    idempotencyKey, status);
            }
            
        } finally {
            responseWrapper.copyBodyToResponse();
        }
    }
}


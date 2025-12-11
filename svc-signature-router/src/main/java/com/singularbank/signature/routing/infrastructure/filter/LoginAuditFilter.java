package com.singularbank.signature.routing.infrastructure.filter;

import com.singularbank.signature.routing.application.service.AuditLogService;
import com.singularbank.signature.routing.domain.model.entity.AuditLog;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Login Audit Filter
 * Epic 17: Comprehensive Audit Trail
 * 
 * <p>Automatically records user LOGIN events to audit_log table.
 * 
 * <p>Tracks first authenticated request per session to avoid duplicates.
 * Uses in-memory session tracking (cleared on app restart).
 * 
 * <p>Captures:
 * <ul>
 *   <li>Username from JWT (preferred_username claim)</li>
 *   <li>User ID from JWT (sub claim)</li>
 *   <li>IP address (supports X-Forwarded-For)</li>
 *   <li>User-Agent</li>
 *   <li>Timestamp</li>
 * </ul>
 * 
 * @since Epic 17
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LoginAuditFilter extends OncePerRequestFilter {
    
    private final AuditLogService auditLogService;
    
    // Track sessions to avoid duplicate LOGIN events
    // Key: userId, Value: sessionId (jti from JWT)
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Process request first
        filterChain.doFilter(request, response);
        
        // After authentication, check if this is a new login
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.isAuthenticated() && auth instanceof JwtAuthenticationToken jwtAuth) {
            try {
                recordLoginIfNew(jwtAuth, request);
            } catch (Exception e) {
                // Graceful degradation: Don't fail request if audit fails
                log.error("Failed to record login audit: {}", e.getMessage());
            }
        }
    }
    
    /**
     * Record login event if this is a new session.
     */
    private void recordLoginIfNew(JwtAuthenticationToken jwtAuth, HttpServletRequest request) {
        Jwt jwt = jwtAuth.getToken();
        
        String userId = jwt.getSubject(); // sub claim
        String sessionId = jwt.getClaimAsString("jti"); // JWT ID (unique per token)
        
        if (userId == null || sessionId == null) {
            return; // Cannot track without userId and sessionId
        }
        
        // Check if this session is already logged
        String existingSession = activeSessions.get(userId);
        
        if (sessionId.equals(existingSession)) {
            // Same session, already logged
            return;
        }
        
        // New session detected, record LOGIN
        String username = extractUsername(jwt);
        UUID userIdUuid = extractUserId(jwt);
        
        Map<String, Object> loginDetails = new HashMap<>();
        loginDetails.put("sessionId", sessionId);
        loginDetails.put("roles", jwt.getClaimAsStringList("roles"));
        loginDetails.put("email", jwt.getClaimAsString("email"));
        loginDetails.put("tokenIssuer", jwt.getIssuer() != null ? jwt.getIssuer().toString() : null);
        loginDetails.put("tokenExpiry", jwt.getExpiresAt());
        
        auditLogService.recordAudit(
            AuditLog.OperationType.LOGIN,
            AuditLog.EntityType.USER_PROFILE,
            userId,
            username,
            loginDetails
        );
        
        // Track this session
        activeSessions.put(userId, sessionId);
        
        log.info("LOGIN audit recorded: user={}, sessionId={}, ip={}",
            username, sessionId, extractIpAddress(request));
    }
    
    /**
     * Extract username from JWT (preferred_username or fallback to sub).
     */
    private String extractUsername(Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) {
            username = jwt.getClaimAsString("email");
        }
        if (username == null) {
            username = jwt.getSubject();
        }
        return username != null ? username : "UNKNOWN";
    }
    
    /**
     * Extract user ID from JWT sub claim.
     */
    private UUID extractUserId(Jwt jwt) {
        String sub = jwt.getSubject();
        if (sub != null) {
            try {
                return UUID.fromString(sub);
            } catch (IllegalArgumentException e) {
                // sub is not a UUID
                return null;
            }
        }
        return null;
    }
    
    /**
     * Extract IP address from request (supports X-Forwarded-For).
     */
    private String extractIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress != null ? ipAddress : "UNKNOWN";
    }
}


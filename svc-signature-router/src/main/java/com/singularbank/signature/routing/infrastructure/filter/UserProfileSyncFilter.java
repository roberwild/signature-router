package com.singularbank.signature.routing.infrastructure.filter;

import com.singularbank.signature.routing.application.service.UserProfileService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Filter that syncs user profile from JWT claims on authenticated requests.
 * 
 * <p>This filter extracts user information from the JWT token and records
 * it in the local database. This allows the Users page to display all
 * users who have accessed the system.</p>
 * 
 * <p>To avoid excessive database writes, it only syncs once per user session
 * (tracked in memory with a short TTL).</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileSyncFilter extends OncePerRequestFilter {
    
    private final UserProfileService userProfileService;
    
    // Cache to avoid syncing on every request (keycloakId -> lastSyncTime)
    private final ConcurrentHashMap<String, Long> syncCache = new ConcurrentHashMap<>();
    
    // Sync interval: 5 minutes (only sync once per 5 minutes per user)
    private static final long SYNC_INTERVAL_MS = 5 * 60 * 1000;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                Jwt jwt = jwtAuth.getToken();
                String keycloakId = jwt.getSubject();
                
                // Check if we need to sync (not synced recently)
                if (shouldSync(keycloakId)) {
                    syncUserProfile(jwt, jwtAuth, getClientIp(request));
                }
            }
        } catch (Exception e) {
            // Don't fail the request if profile sync fails
            log.warn("Failed to sync user profile: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Check if we should sync this user (not synced recently).
     */
    private boolean shouldSync(String keycloakId) {
        Long lastSync = syncCache.get(keycloakId);
        long now = System.currentTimeMillis();
        
        if (lastSync == null || (now - lastSync) > SYNC_INTERVAL_MS) {
            syncCache.put(keycloakId, now);
            return true;
        }
        return false;
    }
    
    /**
     * Extract user info from JWT and sync to database.
     */
    private void syncUserProfile(Jwt jwt, JwtAuthenticationToken jwtAuth, String ipAddress) {
        String keycloakId = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        String fullName = jwt.getClaimAsString("name");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");
        
        // Extract roles from authorities (already converted by KeycloakJwtAuthenticationConverter)
        Set<String> roles = jwtAuth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .map(auth -> auth.replace("ROLE_", "")) // Remove ROLE_ prefix
            .collect(Collectors.toSet());
        
        // Build full name if not provided
        if (fullName == null || fullName.isBlank()) {
            if (firstName != null && lastName != null) {
                fullName = firstName + " " + lastName;
            } else if (firstName != null) {
                fullName = firstName;
            } else if (lastName != null) {
                fullName = lastName;
            } else {
                fullName = username;
            }
        }
        
        log.debug("Syncing user profile: {} ({})", username, keycloakId);
        
        userProfileService.recordLogin(
            keycloakId,
            username != null ? username : keycloakId,
            email,
            fullName,
            firstName,
            lastName,
            roles,
            ipAddress
        );
    }
    
    /**
     * Get client IP address from request.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Take the first IP in the chain
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip filter for public endpoints
        return path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/actuator");
    }
}


package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.AccessEventResponse;
import com.singularbank.signature.routing.application.dto.response.SecurityOverviewResponse;
import com.singularbank.signature.routing.domain.model.entity.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Real Implementation of Keycloak Security Service
 * Epic 16: User Audit Trail - JWT-Based Registration
 * 
 * This implementation uses the local user_profiles table populated
 * by the UserProfileSyncFilter from JWT claims.
 * 
 * Activated when: admin.portal.user-management.mode=LOCAL (or JWT)
 * 
 * @since Epic 16
 */
@Service
@ConditionalOnProperty(
    name = "admin.portal.user-management.mode", 
    havingValue = "LOCAL",
    matchIfMissing = false
)
@RequiredArgsConstructor
@Slf4j
public class KeycloakSecurityServiceImpl implements KeycloakSecurityService {
    
    private final UserProfileService userProfileService;
    
    @Override
    public SecurityOverviewResponse getSecurityOverview() {
        log.info("Getting security overview from local user profiles");
        
        var stats = userProfileService.getStats();
        
        // Currently we don't track 2FA, active tokens, or failed logins
        // These would require additional implementation
        return SecurityOverviewResponse.builder()
            .totalUsers((int) stats.totalUsers())
            .enabledUsers((int) stats.activeUsers())
            .twoFactorPercentage(0.0) // Not implemented yet
            .activeTokens(0) // Not implemented yet (would need session management)
            .failedLogins24h(0) // Not implemented yet (would need audit log)
            .successfulLogins24h(0) // Not implemented yet (would need audit log)
            .status("GOOD") // Default to GOOD
            .build();
    }
    
    @Override
    public List<AccessEventResponse> getAccessAudit(int limit) {
        log.info("Getting access audit from local user profiles (limit: {})", limit);
        
        // Get all user profiles sorted by last login (most recent first)
        var allUsers = userProfileService.getAllUsers();
        
        // Convert to access events
        var events = allUsers.stream()
            .filter(user -> user.getLastLoginAt() != null)
            .sorted((a, b) -> b.getLastLoginAt().compareTo(a.getLastLoginAt()))
            .limit(limit)
            .map(this::toAccessEvent)
            .collect(Collectors.toList());
        
        log.info("Retrieved {} access events from user profiles", events.size());
        
        return events;
    }
    
    /**
     * Convert UserProfile to AccessEventResponse.
     */
    private AccessEventResponse toAccessEvent(UserProfile user) {
        return new AccessEventResponse(
            user.getId().toString(),
            user.getLastLoginAt(),
            "LOGIN", // We only track successful logins currently
            user.getUsername(),
            user.getId().toString(),
            user.getLastLoginIp() != null ? user.getLastLoginIp() : "unknown",
            true, // All recorded logins are successful
            null // No errors for successful logins
        );
    }
}


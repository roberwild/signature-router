package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.AccessEventResponse;
import com.singularbank.signature.routing.application.dto.response.SecurityOverviewResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Mock Implementation of Keycloak Security Service
 * Story 12.6: Keycloak Security Audit Endpoint
 * 
 * This is a mock implementation for development/testing without real Keycloak.
 * In production, replace with KeycloakSecurityServiceImpl that connects to real Keycloak Admin API.
 * 
 * Activated when: admin.portal.user-management.mode=MOCK
 */
@Service
@ConditionalOnProperty(name = "admin.portal.user-management.mode", havingValue = "MOCK", matchIfMissing = true)
@Slf4j
public class KeycloakSecurityServiceMockImpl implements KeycloakSecurityService {
    
    private final Random random = new Random();
    
    public KeycloakSecurityServiceMockImpl() {
        log.warn("🎭 Using MOCK Keycloak Security Service (Development/Testing only)");
    }
    
    @Override
    public SecurityOverviewResponse getSecurityOverview() {
        log.info("[MOCK] Getting security overview");
        
        // Mock data
        int totalUsers = 150;
        int enabledUsers = 142;
        double twoFactorPercentage = 68.5;
        int activeTokens = 45;
        int failedLogins24h = 12;
        int successfulLogins24h = 289;
        
        // Calculate status
        String status;
        if (failedLogins24h > 50 || twoFactorPercentage < 50) {
            status = "CRITICAL";
        } else if (failedLogins24h > 20 || twoFactorPercentage < 70) {
            status = "WARNING";
        } else {
            status = "GOOD";
        }
        
        return SecurityOverviewResponse.builder()
            .totalUsers(totalUsers)
            .enabledUsers(enabledUsers)
            .twoFactorPercentage(twoFactorPercentage)
            .activeTokens(activeTokens)
            .failedLogins24h(failedLogins24h)
            .successfulLogins24h(successfulLogins24h)
            .status(status)
            .build();
    }
    
    @Override
    public List<AccessEventResponse> getAccessAudit(int limit) {
        log.info("[MOCK] Getting access audit events (limit: {})", limit);
        
        List<AccessEventResponse> events = new ArrayList<>();
        
        String[] usernames = {"admin", "operator1", "viewer1", "john.doe", "maria.garcia", "attacker"};
        String[] ips = {"192.168.1.100", "192.168.1.101", "10.0.0.50", "172.16.0.10", "203.0.113.45", "198.51.100.99"};
        
        // Generate mock events (more recent first)
        Instant now = Instant.now();
        
        for (int i = 0; i < Math.min(limit, 100); i++) {
            boolean success = random.nextDouble() > 0.15; // 85% success rate
            String username = usernames[random.nextInt(usernames.length)];
            String ip = ips[random.nextInt(ips.length)];
            
            // Failed logins more likely from suspicious IPs
            if (ip.equals("203.0.113.45") || ip.equals("198.51.100.99")) {
                success = random.nextDouble() > 0.7; // 30% success rate
            }
            
            Instant eventTime = now.minusSeconds(i * 300 + random.nextInt(300)); // Every ~5 min
            
            AccessEventResponse event = new AccessEventResponse(
                "evt-" + (1000 + i),
                eventTime,
                success ? (random.nextDouble() > 0.9 ? "LOGOUT" : "LOGIN") : "LOGIN_ERROR",
                username,
                "user-" + random.nextInt(10),
                ip,
                success,
                success ? null : (random.nextDouble() > 0.5 ? "Invalid credentials" : "Account locked")
            );
            
            events.add(event);
        }
        
        log.info("[MOCK] Generated {} access events", events.size());
        
        return events;
    }
}


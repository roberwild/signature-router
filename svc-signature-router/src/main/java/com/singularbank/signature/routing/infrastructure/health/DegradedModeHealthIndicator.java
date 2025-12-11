package com.singularbank.signature.routing.infrastructure.health;

import com.singularbank.signature.routing.domain.model.valueobject.SystemMode;
import com.singularbank.signature.routing.infrastructure.resilience.DegradedModeManager;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Spring Boot Actuator health indicator for degraded mode status.
 * Story 4.3 AC10: Health Endpoint Indication
 * 
 * <p>Exposes degraded mode status at /actuator/health endpoint.
 * 
 * <p><strong>Health Status:</strong>
 * <ul>
 * <li>System always reports UP (even in degraded mode - system still functional)</li>
 * <li>Component "degradedMode" shows status: NORMAL|DEGRADED|MAINTENANCE</li>
 * <li>Details include: activeProviders, degradedProviders, degradedSince, reason</li>
 * </ul>
 * 
 * <p><strong>Example Response (DEGRADED):</strong>
 * <pre>
 * {
 *   "status": "UP",
 *   "components": {
 *     "degradedMode": {
 *       "status": "DEGRADED",
 *       "details": {
 *         "mode": "DEGRADED",
 *         "degradedProviders": ["SMS", "PUSH", "VOICE"],
 *         "activeProviders": ["BIOMETRIC"],
 *         "degradedSince": "2025-11-28T10:30:00Z",
 *         "degradedReason": "Error rate 85% exceeds threshold 80%"
 *       }
 *     }
 *   }
 * }
 * </pre>
 * 
 * @since Story 4.3 - Degraded Mode Manager
 */
@Component("degradedModeHealthIndicator")
@RequiredArgsConstructor
public class DegradedModeHealthIndicator implements HealthIndicator {
    
    private final DegradedModeManager degradedModeManager;
    
    private static final String[] ALL_PROVIDERS = {"SMS", "PUSH", "VOICE", "BIOMETRIC"};
    
    @Override
    public Health health() {
        SystemMode currentMode = degradedModeManager.getCurrentMode();
        List<String> degradedProviders = degradedModeManager.getDegradedProviders();
        List<String> activeProviders = getActiveProviders(degradedProviders);
        
        // System always UP (degraded mode is not a failure, it's graceful degradation)
        Health.Builder healthBuilder = Health.up();
        
        // Add mode details
        healthBuilder
            .withDetail("mode", currentMode.name())
            .withDetail("degradedProviders", degradedProviders)
            .withDetail("activeProviders", activeProviders);
        
        // If degraded, add additional context
        if (currentMode == SystemMode.DEGRADED) {
            healthBuilder
                .withDetail("degradedSince", degradedModeManager.getDegradedSince())
                .withDetail("degradedReason", degradedModeManager.getDegradedReason())
                .status("DEGRADED");  // Custom status for clarity
        }
        
        return healthBuilder.build();
    }
    
    /**
     * Calculate active providers (providers NOT in degraded state).
     * 
     * @param degradedProviders list of degraded providers
     * @return list of active (non-degraded) providers
     */
    private List<String> getActiveProviders(List<String> degradedProviders) {
        return java.util.Arrays.stream(ALL_PROVIDERS)
            .filter(provider -> !degradedProviders.contains(provider))
            .toList();
    }
}


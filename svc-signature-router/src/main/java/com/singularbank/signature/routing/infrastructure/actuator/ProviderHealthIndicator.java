package com.singularbank.signature.routing.infrastructure.actuator;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Spring Boot Actuator health indicator for provider error rates.
 * 
 * <p>Exposes provider error rate status at /actuator/health/providers endpoint.
 * 
 * <p><strong>Health Status:</strong>
 * <ul>
 * <li>UP: error rate < 25% (healthy)</li>
 * <li>WARNING: 25% ≤ error rate < 50% (degraded)</li>
 * <li>DOWN: error rate ≥ 50% (critical)</li>
 * </ul>
 * 
 * <p><strong>Example Response (Mixed Status):</strong>
 * <pre>
 * {
 *   "status": "WARNING",
 *   "components": {
 *     "providers": {
 *       "status": "WARNING",
 *       "details": {
 *         "SMS": {
 *           "errorRate": 0.35,
 *           "errorRatePercentage": "35.00%",
 *           "status": "WARNING"
 *         },
 *         "PUSH": {
 *           "errorRate": 0.10,
 *           "errorRatePercentage": "10.00%",
 *           "status": "UP"
 *         },
 *         "VOICE": {
 *           "errorRate": 0.65,
 *           "errorRatePercentage": "65.00%",
 *           "status": "DOWN"
 *         },
 *         "BIOMETRIC": {
 *           "errorRate": 0.00,
 *           "errorRatePercentage": "0.00%",
 *           "status": "UP"
 *         },
 *         "overallStatus": "WARNING"
 *       }
 *     }
 *   }
 * }
 * </pre>
 * 
 * @since Story 4.4 - Provider Error Rate Calculator
 */
@Component("providerErrorRateHealthIndicator")
@RequiredArgsConstructor
@Slf4j
public class ProviderHealthIndicator implements HealthIndicator {
    
    private final MeterRegistry meterRegistry;
    
    private static final String[] PROVIDER_TYPES = {"SMS", "PUSH", "VOICE", "BIOMETRIC"};
    
    // Error rate thresholds
    private static final double WARNING_THRESHOLD = 0.25;  // 25%
    private static final double CRITICAL_THRESHOLD = 0.50;  // 50%
    
    // Custom health status
    private static final Status WARNING = new Status("WARNING");
    
    @Override
    public Health health() {
        Map<String, Object> details = new HashMap<>();
        Status overallStatus = Status.UP;
        
        for (String provider : PROVIDER_TYPES) {
            try {
                // Query provider.error.rate gauge
                Gauge errorRateGauge = meterRegistry.find("provider.error.rate")
                    .tag("provider", provider)
                    .gauge();
                
                double errorRate = (errorRateGauge != null) ? errorRateGauge.value() : 0.0;
                
                // Determine provider status
                Status providerStatus = determineStatus(errorRate);
                
                // Build provider details
                Map<String, Object> providerDetails = new HashMap<>();
                providerDetails.put("errorRate", errorRate);
                providerDetails.put("errorRatePercentage", String.format("%.2f%%", errorRate * 100));
                providerDetails.put("status", providerStatus.getCode());
                
                details.put(provider, providerDetails);
                
                // Update overall status (worst status wins)
                overallStatus = worstStatus(overallStatus, providerStatus);
                
            } catch (Exception e) {
                log.error("Failed to get error rate for provider: provider={}, error={}", 
                    provider, e.getMessage(), e);
                
                // Provider health check failed
                Map<String, Object> providerDetails = new HashMap<>();
                providerDetails.put("errorRate", "N/A");
                providerDetails.put("errorRatePercentage", "N/A");
                providerDetails.put("status", "UNKNOWN");
                providerDetails.put("error", e.getMessage());
                
                details.put(provider, providerDetails);
                overallStatus = worstStatus(overallStatus, Status.UNKNOWN);
            }
        }
        
        details.put("overallStatus", overallStatus.getCode());
        
        // Build health response
        return Health.status(overallStatus)
            .withDetails(details)
            .build();
    }
    
    /**
     * Determine health status based on error rate.
     * 
     * @param errorRate the error rate (0.0 to 1.0)
     * @return health status (UP, WARNING, DOWN)
     */
    private Status determineStatus(double errorRate) {
        if (errorRate >= CRITICAL_THRESHOLD) {
            return Status.DOWN;  // Critical: ≥ 50%
        } else if (errorRate >= WARNING_THRESHOLD) {
            return WARNING;  // Warning: ≥ 25%
        } else {
            return Status.UP;  // Healthy: < 25%
        }
    }
    
    /**
     * Return the worst status between two statuses.
     * 
     * <p>Priority: DOWN > UNKNOWN > WARNING > UP
     * 
     * @param status1 first status
     * @param status2 second status
     * @return worst status
     */
    private Status worstStatus(Status status1, Status status2) {
        // Priority order: DOWN > UNKNOWN > WARNING > UP
        if (status1.equals(Status.DOWN) || status2.equals(Status.DOWN)) {
            return Status.DOWN;
        }
        if (status1.equals(Status.UNKNOWN) || status2.equals(Status.UNKNOWN)) {
            return Status.UNKNOWN;
        }
        if (status1.equals(WARNING) || status2.equals(WARNING)) {
            return WARNING;
        }
        return Status.UP;
    }
}


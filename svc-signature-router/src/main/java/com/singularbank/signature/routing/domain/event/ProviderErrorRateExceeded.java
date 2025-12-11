package com.singularbank.signature.routing.domain.event;

import lombok.Value;

import java.time.Instant;

/**
 * Domain event published when a provider's error rate exceeds the configured threshold.
 * 
 * <p>This event is published by {@code ProviderErrorRateCalculator} when:
 * <ul>
 * <li>Error rate > threshold (default 50%) for sustained duration (default 30 seconds)</li>
 * <li>Provider experiencing high failure rate requiring intervention</li>
 * </ul>
 * 
 * <p><strong>Event Consumers:</strong>
 * <ul>
 * <li>{@code DegradedModeManager} - Activates degraded mode for affected provider</li>
 * <li>Admin notification systems (future)</li>
 * <li>Auto-remediation workflows (future)</li>
 * </ul>
 * 
 * <p><strong>Example Usage:</strong>
 * <pre>{@code
 * // In ProviderErrorRateCalculator
 * if (errorRate > threshold && errorRateSustainedFor30Seconds) {
 *     applicationEventPublisher.publishEvent(
 *         new ProviderErrorRateExceeded("SMS", 0.65, 0.50, Instant.now())
 *     );
 * }
 * 
 * // In DegradedModeManager
 * @EventListener
 * public void onProviderErrorRateExceeded(ProviderErrorRateExceeded event) {
 *     activateDegradedMode(event.getProvider(), Duration.ofMinutes(5));
 * }
 * }</pre>
 * 
 * @since Story 4.4 - Provider Error Rate Calculator
 */
@Value
public class ProviderErrorRateExceeded {
    
    /**
     * Provider name (SMS, PUSH, VOICE, BIOMETRIC).
     */
    String provider;
    
    /**
     * Current error rate (0.0 to 1.0, e.g., 0.65 = 65%).
     */
    double errorRate;
    
    /**
     * Configured threshold that was exceeded (0.0 to 1.0, e.g., 0.50 = 50%).
     */
    double threshold;
    
    /**
     * Timestamp when the event was created.
     */
    Instant timestamp;
    
    /**
     * Get error rate as percentage for logging/display.
     * 
     * @return error rate percentage (e.g., 65.0 for 65%)
     */
    public double getErrorRatePercentage() {
        return errorRate * 100.0;
    }
    
    /**
     * Get threshold as percentage for logging/display.
     * 
     * @return threshold percentage (e.g., 50.0 for 50%)
     */
    public double getThresholdPercentage() {
        return threshold * 100.0;
    }
}


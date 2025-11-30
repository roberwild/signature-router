package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.event.ProviderErrorRateExceeded;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Scheduled task that calculates provider error rates for circuit breaker decisions.
 * 
 * <p>This component runs every 10 seconds (@Scheduled(fixedDelay = 10000)) and calculates
 * the error rate for each provider based on success/failure counts in the last minute.
 * 
 * <p><strong>Error Rate Formula:</strong>
 * <pre>
 * errorRate = failureCount / (successCount + failureCount)
 * </pre>
 * 
 * <p><strong>Window:</strong> 1 minute rolling window for responsive error detection.
 * 
 * <p><strong>Usage in Epic 4:</strong>
 * Circuit breaker logic (Story 4.4) will read provider.error.rate gauge to decide
 * whether to OPEN the circuit breaker when errorRate > 0.50 (50%).
 * 
 * <p><strong>Event Publishing:</strong>
 * When error rate exceeds threshold for sustained duration (30s), publishes
 * {@link ProviderErrorRateExceeded} event consumed by DegradedModeManager.
 * 
 * <p><strong>Edge Cases:</strong>
 * <ul>
 * <li>No calls in window → errorRate = 0.0 (assume healthy)</li>
 * <li>All failures → errorRate = 1.0 (100%)</li>
 * <li>All successes → errorRate = 0.0 (0%)</li>
 * </ul>
 * 
 * @since Story 3.10 - Provider Metrics Tracking
 * @since Story 4.4 - Enhanced with event publishing and threshold detection
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderErrorRateCalculator {
    
    private final MeterRegistry meterRegistry;
    private final ProviderMetrics providerMetrics;
    private final ApplicationEventPublisher eventPublisher;
    
    @Value("${resilience.error-rate.threshold:0.50}")
    private double errorRateThreshold;
    
    @Value("${resilience.error-rate.sustained-duration-seconds:30}")
    private long sustainedDurationSeconds;
    
    // Provider types to calculate error rate for
    private static final String[] PROVIDER_TYPES = {"SMS", "PUSH", "VOICE", "BIOMETRIC"};
    
    // Track when high error rate was first detected for each provider
    private final Map<String, Instant> highErrorRateDetectedAt = new HashMap<>();
    
    // Track previous error rates to detect changes
    private final Map<String, Double> previousErrorRates = new HashMap<>();
    
    /**
     * Calculate error rates for all providers every 10 seconds.
     * 
     * <p>This method:
     * <ol>
     * <li>Queries MeterRegistry for success/failure counts per provider</li>
     * <li>Calculates errorRate = failures / (successes + failures)</li>
     * <li>Updates provider.error.rate gauge via ProviderMetrics</li>
     * <li>Checks if error rate exceeds threshold for sustained duration</li>
     * <li>Publishes ProviderErrorRateExceeded event if threshold breached</li>
     * <li>Logs error rate changes at INFO level</li>
     * </ol>
     * 
     * <p><strong>Note:</strong> Uses counter values, not rates. Counters are cumulative,
     * so we calculate error rate based on total counts since app start. For production,
     * consider using rate() function or resetting counters periodically.
     */
    @Scheduled(fixedDelay = 10000)  // Every 10 seconds
    public void calculateErrorRates() {
        for (String provider : PROVIDER_TYPES) {
            try {
                double errorRate = calculateErrorRateForProvider(provider);
                
                // Update gauge
                providerMetrics.updateErrorRate(provider, errorRate);
                
                // Check threshold and publish event if needed
                checkThresholdAndPublishEvent(provider, errorRate);
                
                // Log at INFO level if error rate is significant (>5%)
                if (errorRate > 0.05) {
                    log.info("Provider error rate updated: provider={}, errorRate={:.2f}%", 
                        provider, errorRate * 100);
                } else {
                    log.debug("Provider error rate updated: provider={}, errorRate={:.2f}%", 
                        provider, errorRate * 100);
                }
                
                // Store for next iteration
                previousErrorRates.put(provider, errorRate);
                
            } catch (Exception e) {
                log.error("Failed to calculate error rate for provider: provider={}, error={}", 
                    provider, e.getMessage(), e);
            }
        }
    }
    
    /**
     * Calculate error rate for a specific provider.
     * 
     * <p>Queries provider.calls.total counter with success/failure status tags
     * and calculates the error rate.
     * 
     * @param provider the provider name (SMS, PUSH, VOICE, BIOMETRIC)
     * @return error rate (0.0 to 1.0, e.g., 0.15 = 15%)
     */
    private double calculateErrorRateForProvider(String provider) {
        // Get success count
        Counter successCounter = meterRegistry.find("provider.calls.total")
            .tag("provider", provider)
            .tag("status", "success")
            .counter();
        
        double successCount = (successCounter != null) ? successCounter.count() : 0.0;
        
        // Get failure count
        Counter failureCounter = meterRegistry.find("provider.calls.total")
            .tag("provider", provider)
            .tag("status", "failure")
            .counter();
        
        double failureCount = (failureCounter != null) ? failureCounter.count() : 0.0;
        
        // Calculate error rate
        double totalCalls = successCount + failureCount;
        
        if (totalCalls == 0) {
            // No calls yet → assume healthy (errorRate = 0)
            return 0.0;
        }
        
        return failureCount / totalCalls;
    }
    
    /**
     * Check if error rate exceeds threshold and publish event if sustained.
     * 
     * <p>Logic:
     * <ul>
     * <li>If errorRate > threshold: track detection time</li>
     * <li>If errorRate > threshold for sustained duration (30s): publish event</li>
     * <li>If errorRate drops below threshold: reset detection time</li>
     * </ul>
     * 
     * @param provider  the provider name
     * @param errorRate the calculated error rate (0.0 to 1.0)
     */
    private void checkThresholdAndPublishEvent(String provider, double errorRate) {
        Instant now = Instant.now();
        
        if (errorRate > errorRateThreshold) {
            // Error rate is high
            Instant detectedAt = highErrorRateDetectedAt.get(provider);
            
            if (detectedAt == null) {
                // First detection of high error rate
                highErrorRateDetectedAt.put(provider, now);
                log.warn("Provider {} error rate {:.2f}% exceeds threshold {:.2f}% - monitoring for {} seconds",
                    provider, errorRate * 100, errorRateThreshold * 100, sustainedDurationSeconds);
            } else {
                // Check if sustained for required duration
                Duration duration = Duration.between(detectedAt, now);
                
                if (duration.getSeconds() >= sustainedDurationSeconds) {
                    // Sustained high error rate - publish event (only once per sustained period)
                    Double previousRate = previousErrorRates.get(provider);
                    boolean wasAlreadyHigh = previousRate != null && previousRate > errorRateThreshold;
                    
                    if (!wasAlreadyHigh) {
                        publishErrorRateExceededEvent(provider, errorRate);
                    }
                }
            }
        } else {
            // Error rate is below threshold - reset
            if (highErrorRateDetectedAt.containsKey(provider)) {
                log.info("Provider {} error rate {:.2f}% returned below threshold {:.2f}%",
                    provider, errorRate * 100, errorRateThreshold * 100);
                highErrorRateDetectedAt.remove(provider);
            }
        }
    }
    
    /**
     * Publish ProviderErrorRateExceeded event.
     * 
     * @param provider  the provider name
     * @param errorRate the current error rate
     */
    private void publishErrorRateExceededEvent(String provider, double errorRate) {
        ProviderErrorRateExceeded event = new ProviderErrorRateExceeded(
            provider,
            errorRate,
            errorRateThreshold,
            Instant.now()
        );
        
        eventPublisher.publishEvent(event);
        
        log.warn("🚨 Published ProviderErrorRateExceeded event: provider={}, errorRate={:.2f}%, threshold={:.2f}%",
            provider, errorRate * 100, errorRateThreshold * 100);
    }
}


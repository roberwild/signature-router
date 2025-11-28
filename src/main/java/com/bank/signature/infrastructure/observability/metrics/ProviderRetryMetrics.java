package com.bank.signature.infrastructure.observability.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Metrics component for tracking provider retry events.
 * 
 * <p>This component provides methods to record Prometheus metrics for retry behavior:
 * <ul>
 * <li>Retry attempts per provider and attempt number</li>
 * <li>Success after retries with attempt count</li>
 * <li>Retry exhaustion (all attempts failed)</li>
 * <li>Total retry duration (time from first attempt to final result)</li>
 * </ul>
 * 
 * <p><strong>Metrics Exported:</strong>
 * <pre>
 * provider_retry_attempts_total{provider="SMS|PUSH|VOICE|BIOMETRIC", attempt="1|2|3"}
 * provider_retry_success_total{provider="...", after_attempts="1|2|3"}
 * provider_retry_exhausted_total{provider="..."}
 * provider_retry_duration{provider="..."}  # Histogram
 * </pre>
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // Record retry attempt
 * providerRetryMetrics.recordRetryAttempt("SMS", 2);  // 2nd attempt
 * 
 * // Record success after 3 attempts
 * providerRetryMetrics.recordRetrySuccess("SMS", 3);
 * 
 * // Record retry exhausted after 3 attempts
 * providerRetryMetrics.recordRetryExhausted("SMS", 3);
 * 
 * // Record total retry duration
 * Duration totalDuration = Duration.ofSeconds(5);
 * providerRetryMetrics.recordRetryDuration("SMS", totalDuration);
 * }</pre>
 * 
 * @since Story 3.9 - Provider Retry Logic
 */
@Component
@RequiredArgsConstructor
public class ProviderRetryMetrics {
    
    private final MeterRegistry meterRegistry;
    
    /**
     * Record a retry attempt for a specific provider.
     * 
     * @param provider      the provider name (SMS, PUSH, VOICE, BIOMETRIC)
     * @param attemptNumber the attempt number (1 = first, 2 = first retry, etc.)
     */
    public void recordRetryAttempt(String provider, int attemptNumber) {
        meterRegistry.counter("provider.retry.attempts.total",
            "provider", provider,
            "attempt", String.valueOf(attemptNumber)
        ).increment();
    }
    
    /**
     * Record a successful provider call after retries.
     * 
     * @param provider      the provider name
     * @param totalAttempts the total number of attempts (including first and all retries)
     */
    public void recordRetrySuccess(String provider, int totalAttempts) {
        meterRegistry.counter("provider.retry.success.total",
            "provider", provider,
            "after_attempts", String.valueOf(totalAttempts)
        ).increment();
    }
    
    /**
     * Record a retry exhaustion (all attempts failed).
     * 
     * @param provider      the provider name
     * @param totalAttempts the total number of attempts made
     */
    public void recordRetryExhausted(String provider, int totalAttempts) {
        meterRegistry.counter("provider.retry.exhausted.total",
            "provider", provider
        ).increment();
    }
    
    /**
     * Record the total duration of a retry window.
     * 
     * <p>This measures the time from the first attempt to the final result
     * (success or exhaustion), including all retry delays.
     * 
     * @param provider the provider name
     * @param duration the total duration from first attempt to final result
     */
    public void recordRetryDuration(String provider, Duration duration) {
        meterRegistry.timer("provider.retry.duration",
            "provider", provider
        ).record(duration);
    }
    
    /**
     * Create a timer sample to measure retry duration.
     * 
     * <p><strong>Usage:</strong>
     * <pre>{@code
     * Timer.Sample sample = providerRetryMetrics.startRetryTimer();
     * try {
     *     // ... provider call with retries ...
     * } finally {
     *     providerRetryMetrics.stopRetryTimer(sample, "SMS");
     * }
     * }</pre>
     * 
     * @return a timer sample
     */
    public Timer.Sample startRetryTimer() {
        return Timer.start(meterRegistry);
    }
    
    /**
     * Stop the retry timer and record the duration.
     * 
     * @param sample   the timer sample from {@link #startRetryTimer()}
     * @param provider the provider name
     */
    public void stopRetryTimer(Timer.Sample sample, String provider) {
        sample.stop(meterRegistry.timer("provider.retry.duration", "provider", provider));
    }
}


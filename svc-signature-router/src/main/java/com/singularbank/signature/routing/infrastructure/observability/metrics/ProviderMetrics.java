package com.singularbank.signature.routing.infrastructure.observability.metrics;

import com.singularbank.signature.routing.domain.model.valueobject.ProviderResult;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Metrics component for tracking provider call performance and errors.
 * 
 * <p>This component provides centralized methods to record Prometheus metrics for provider behavior:
 * <ul>
 * <li>Provider call success/failure counters with tags</li>
 * <li>Provider latency histograms for SLO tracking</li>
 * <li>Error rate gauges for circuit breaker decisions (Epic 4)</li>
 * <li>Timeout-specific metrics</li>
 * </ul>
 * 
 * <p><strong>Metrics Exported:</strong>
 * <pre>
 * provider_calls_total{provider="SMS|PUSH|VOICE|BIOMETRIC", status="success|failure", channel_type="...", retried="true|false"}
 * provider_failures_total{provider="...", error_code="TIMEOUT|API_ERROR|..."}
 * provider_latency{provider="...", status="...", attempt_number="1|2|3"}  # Histogram
 * provider_timeout_duration{provider="..."}  # Histogram
 * provider_error_rate{provider="..."}  # Gauge
 * </pre>
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // In SignatureProviderAdapter.sendChallenge()
 * Instant startTime = Instant.now();
 * ProviderResult result = provider.sendChallenge(challenge, recipient);
 * Duration duration = Duration.between(startTime, Instant.now());
 * 
 * providerMetrics.recordProviderCall(
 *     providerType.name(),  // "SMS"
 *     channelType.name(),   // "SMS"
 *     result,               // ProviderResult with success, errorCode, retriedSuccess
 *     duration              // Total duration
 * );
 * }</pre>
 * 
 * <p><strong>Integration with Existing Metrics:</strong>
 * <ul>
 * <li>Reuses provider.timeout.total from Story 3.8 (via SignatureProviderAdapter)</li>
 * <li>Complements provider.retry.* metrics from Story 3.9 (ProviderRetryMetrics)</li>
 * <li>No duplication - new metrics: provider.calls.total, provider.latency, provider.error.rate</li>
 * </ul>
 * 
 * @since Story 3.10 - Provider Metrics Tracking
 * @see ProviderRetryMetrics
 */
@Component
@RequiredArgsConstructor
public class ProviderMetrics {
    
    private final MeterRegistry meterRegistry;
    
    /**
     * Record a provider call with comprehensive metrics.
     * 
     * <p>This method registers:
     * <ul>
     * <li>provider.calls.total counter with tags (provider, status, channel_type, retried)</li>
     * <li>provider.failures.total counter if failure (with error_code tag)</li>
     * <li>provider.latency histogram with duration sample</li>
     * </ul>
     * 
     * <p><strong>Tags Applied:</strong>
     * <ul>
     * <li>provider: SMS, PUSH, VOICE, BIOMETRIC</li>
     * <li>status: "success" or "failure"</li>
     * <li>channel_type: SMS, PUSH, VOICE, BIOMETRIC (same as provider typically)</li>
     * <li>retried: "true" if result.retriedSuccess(), "false" otherwise</li>
     * <li>attempt_number: 1, 2, 3, etc. (from result.attemptNumber())</li>
     * </ul>
     * 
     * @param provider      the provider name (SMS, PUSH, VOICE, BIOMETRIC)
     * @param channelType   the channel type (typically same as provider)
     * @param result        the ProviderResult containing success, errorCode, timedOut, attemptNumber, retriedSuccess
     * @param duration      the total duration from call start to completion
     * @throws NullPointerException if any parameter is null
     */
    public void recordProviderCall(String provider, String channelType, ProviderResult result, Duration duration) {
        String status = result.success() ? "success" : "failure";
        String retried = String.valueOf(result.retriedSuccess());
        String attemptNumber = String.valueOf(result.attemptNumber());
        
        // Record provider.calls.total counter
        meterRegistry.counter("provider.calls.total",
            "provider", provider,
            "status", status,
            "channel_type", channelType,
            "retried", retried
        ).increment();
        
        // Record provider.failures.total if failure
        if (!result.success()) {
            meterRegistry.counter("provider.failures.total",
                "provider", provider,
                "error_code", result.errorCode()
            ).increment();
            
            // Record provider.errors.total with error classification (AC5)
            String errorType = classifyErrorType(result.errorCode());
            meterRegistry.counter("provider.errors.total",
                "provider", provider,
                "error_type", errorType
            ).increment();
        }
        
        // Record provider.latency histogram
        meterRegistry.timer("provider.latency",
            "provider", provider,
            "status", status,
            "attempt_number", attemptNumber
        ).record(duration);
    }
    
    /**
     * Record a timeout event with specific metrics.
     * 
     * <p>This method registers:
     * <ul>
     * <li>provider.timeout.duration histogram (new in Story 3.10)</li>
     * </ul>
     * 
     * <p><strong>Note:</strong> provider.timeout.total counter is incremented by
     * SignatureProviderAdapter (Story 3.8) - this method does NOT duplicate it.
     * 
     * @param provider the provider name
     * @param duration the duration until timeout (typically ~timeout config: 5s SMS, 10s VOICE)
     */
    public void recordTimeout(String provider, Duration duration) {
        meterRegistry.timer("provider.timeout.duration",
            "provider", provider
        ).record(duration);
    }
    
    /**
     * Update the error rate gauge for a specific provider.
     * 
     * <p>This method is called by ProviderErrorRateCalculator (scheduled task)
     * to update the provider.error.rate gauge every 10 seconds.
     * 
     * <p>Error rate is calculated as:
     * <pre>
     * errorRate = failureCount / (successCount + failureCount)
     * </pre>
     * 
     * <p>Used by Epic 4 circuit breaker logic for decisions.
     * 
     * @param provider  the provider name
     * @param errorRate the error rate (0.0 to 1.0, e.g., 0.15 = 15%)
     */
    public void updateErrorRate(String provider, double errorRate) {
        meterRegistry.gauge("provider.error.rate",
            java.util.List.of(
                io.micrometer.core.instrument.Tag.of("provider", provider)
            ),
            errorRate
        );
    }
    
    /**
     * Record a circuit breaker event publication success.
     * 
     * <p>This method increments the circuit_breaker.events.published.total counter
     * for successful Kafka event publishing.
     * 
     * <p><strong>Story 4.8:</strong> Circuit Breaker Event Publishing
     * 
     * @param provider  the provider name (SMS, PUSH, VOICE, BIOMETRIC)
     * @param eventType the circuit breaker event type (OPENED, HALF_OPEN, CLOSED, FAILED_RECOVERY, RESET)
     * @since Story 4.8
     */
    public void recordCircuitBreakerEventPublished(String provider, String eventType) {
        meterRegistry.counter("circuit_breaker.events.published.total",
            "provider", provider,
            "event_type", eventType
        ).increment();
    }
    
    /**
     * Record a circuit breaker event publication failure.
     * 
     * <p>This method increments the circuit_breaker.events.publish_failed.total counter
     * when Kafka event publishing fails (e.g., Kafka down, network error).
     * 
     * <p><strong>Story 4.8:</strong> Circuit Breaker Event Publishing
     * 
     * @param provider  the provider name (SMS, PUSH, VOICE, BIOMETRIC)
     * @param eventType the circuit breaker event type that failed to publish
     * @since Story 4.8
     */
    public void recordCircuitBreakerEventPublishFailed(String provider, String eventType) {
        meterRegistry.counter("circuit_breaker.events.publish_failed.total",
            "provider", provider,
            "event_type", eventType
        ).increment();
    }
    
    /**
     * Classify error code into transient or permanent error type.
     * 
     * <p><strong>Transient errors</strong> (retryable):
     * <ul>
     * <li>TIMEOUT - Provider exceeded timeout</li>
     * <li>API_ERROR - Generic API error (5xx)</li>
     * <li>PROVIDER_ERROR - Provider unavailable</li>
     * <li>INTERRUPTED - Thread interrupted</li>
     * </ul>
     * 
     * <p><strong>Permanent errors</strong> (non-retryable):
     * <ul>
     * <li>INVALID_PHONE - Bad phone number (4xx)</li>
     * <li>AUTHENTICATION_FAILED - Invalid credentials (4xx)</li>
     * <li>RETRY_EXHAUSTED - All retries failed</li>
     * <li>Others - Unknown permanent errors</li>
     * </ul>
     * 
     * @param errorCode the error code from ProviderResult
     * @return "transient" or "permanent"
     */
    private String classifyErrorType(String errorCode) {
        if (errorCode == null) {
            return "permanent";
        }
        
        // Transient errors (5xx, timeouts, network issues)
        if (errorCode.equals("TIMEOUT") ||
            errorCode.equals("API_ERROR") ||
            errorCode.equals("PROVIDER_ERROR") ||
            errorCode.equals("INTERRUPTED") ||
            errorCode.startsWith("TWILIO_API_ERROR_5") ||
            errorCode.startsWith("TWILIO_VOICE_ERROR_5") ||
            errorCode.contains("UNAVAILABLE") ||
            errorCode.contains("INTERNAL")) {
            return "transient";
        }
        
        // Permanent errors (4xx, auth, validation)
        return "permanent";
    }
}


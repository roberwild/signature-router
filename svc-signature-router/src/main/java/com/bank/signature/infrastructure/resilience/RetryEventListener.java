package com.bank.signature.infrastructure.resilience;

import io.github.resilience4j.retry.event.*;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Event listener for Resilience4j retry events.
 * 
 * <p>This component listens to retry lifecycle events and performs:
 * <ul>
 * <li>Structured logging with traceId for all retry attempts</li>
 * <li>Prometheus metrics publishing for observability</li>
 * <li>Duration tracking for retry windows</li>
 * </ul>
 * 
 * <p><strong>Events Handled:</strong>
 * <ul>
 * <li>{@link RetryOnRetryEvent} - Retry attempt triggered (log WARNING)</li>
 * <li>{@link RetryOnSuccessEvent} - Success after retries (log INFO)</li>
 * <li>{@link RetryOnErrorEvent} - Retry exhausted (log ERROR)</li>
 * </ul>
 * 
 * <p><strong>Metrics Published:</strong>
 * <pre>
 * provider.retry.attempts.total{provider, attempt}    - Counter per retry attempt
 * provider.retry.success.total{provider, after_attempts} - Counter for success after N retries
 * provider.retry.exhausted.total{provider}            - Counter for exhausted retries
 * </pre>
 * 
 * <p><strong>Log Format:</strong>
 * <pre>
 * WARN - Provider retry attempt 2/3: provider=SMS, exception=TimeoutException, traceId=abc-123
 * INFO - Provider success after 2 retries: provider=SMS, total_duration=3500ms, traceId=abc-123
 * ERROR - Provider retry exhausted: provider=SMS, attempts=3, last_error=ApiException, traceId=abc-123
 * </pre>
 * 
 * @since Story 3.9 - Provider Retry Logic
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RetryEventListener {
    
    private final MeterRegistry meterRegistry;
    
    /**
     * Handle retry attempt events.
     * 
     * <p>Triggered when Resilience4j decides to retry after a failure.
     * Logs at WARNING level with retry attempt number and traceId.
     * 
     * @param event the retry event
     */
    @EventListener
    public void onRetryEvent(RetryOnRetryEvent event) {
        String retryName = event.getName();
        int attemptNumber = event.getNumberOfRetryAttempts() + 1; // +1 because first attempt is 0
        Throwable lastException = event.getLastThrowable();
        String traceId = MDC.get("traceId");
        
        // Extract provider name from retry instance name (e.g., "smsRetry" -> "SMS")
        String provider = extractProviderName(retryName);
        
        log.warn("Provider retry attempt {}: provider={}, exception={}, traceId={}", 
            attemptNumber,
            provider,
            lastException.getClass().getSimpleName(),
            traceId);
        
        // Record retry attempt metrics
        meterRegistry.counter("provider.retry.attempts.total",
            "provider", provider,
            "attempt", String.valueOf(attemptNumber)
        ).increment();
    }
    
    /**
     * Handle retry success events.
     * 
     * <p>Triggered when a retry attempt succeeds after previous failures.
     * Logs at INFO level with total retry duration and final attempt number.
     * 
     * @param event the success event
     */
    @EventListener
    public void onSuccessEvent(RetryOnSuccessEvent event) {
        String retryName = event.getName();
        int totalAttempts = event.getNumberOfRetryAttempts() + 1; // Total attempts including first
        String traceId = MDC.get("traceId");
        
        // Only log if there were actual retries (attempts > 1)
        if (totalAttempts > 1) {
            String provider = extractProviderName(retryName);
            
            log.info("Provider success after {} retries: provider={}, traceId={}", 
                totalAttempts - 1,  // Retries = total attempts - 1
                provider,
                traceId);
            
            // Record success after retry metrics
            meterRegistry.counter("provider.retry.success.total",
                "provider", provider,
                "after_attempts", String.valueOf(totalAttempts)
            ).increment();
        }
    }
    
    /**
     * Handle retry exhausted events.
     * 
     * <p>Triggered when all retry attempts have been exhausted without success.
     * Logs at ERROR level with total attempts and final exception.
     * 
     * @param event the error event
     */
    @EventListener
    public void onErrorEvent(RetryOnErrorEvent event) {
        String retryName = event.getName();
        int totalAttempts = event.getNumberOfRetryAttempts() + 1;
        Throwable lastException = event.getLastThrowable();
        String traceId = MDC.get("traceId");
        
        String provider = extractProviderName(retryName);
        
        log.error("Provider retry exhausted: provider={}, attempts={}, last_error={}, message={}, traceId={}", 
            provider,
            totalAttempts,
            lastException.getClass().getSimpleName(),
            lastException.getMessage(),
            traceId);
        
        // Record retry exhausted metrics
        meterRegistry.counter("provider.retry.exhausted.total",
            "provider", provider
        ).increment();
    }
    
    /**
     * Extract provider name from retry instance name.
     * 
     * <p>Converts retry instance names to provider names:
     * <ul>
     * <li>"smsRetry" → "SMS"</li>
     * <li>"pushRetry" → "PUSH"</li>
     * <li>"voiceRetry" → "VOICE"</li>
     * <li>"biometricRetry" → "BIOMETRIC"</li>
     * </ul>
     * 
     * @param retryName the Resilience4j retry instance name
     * @return the provider name in uppercase
     */
    private String extractProviderName(String retryName) {
        if (retryName == null || retryName.isEmpty()) {
            return "UNKNOWN";
        }
        
        // Remove "Retry" suffix and convert to uppercase
        String providerName = retryName.replace("Retry", "").toUpperCase();
        
        // Handle legacy "twilioProvider" name
        if ("TWILIOPROVIDER".equals(providerName)) {
            return "SMS";
        }
        
        return providerName;
    }
}


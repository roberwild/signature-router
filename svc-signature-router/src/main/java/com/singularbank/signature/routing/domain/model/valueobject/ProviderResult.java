package com.singularbank.signature.routing.domain.model.valueobject;

import java.time.Instant;
import java.util.Objects;

/**
 * Value object representing the result of a provider call.
 * 
 * <p>This immutable record can represent either a successful or failed provider interaction,
 * following the Result pattern to avoid throwing exceptions in the domain layer.
 * 
 * <p><strong>Success Example:</strong>
 * <pre>{@code
 * ProviderResult result = ProviderResult.success("SM1234567890abcdef", "{\"status\":\"sent\"}");
 * if (result.success()) {
 *     String messageId = result.providerChallengeId(); // "SM1234567890abcdef"
 *     String proof = result.providerProof();           // Full JSON response
 * }
 * }</pre>
 * 
 * <p><strong>Failure Example:</strong>
 * <pre>{@code
 * ProviderResult result = ProviderResult.failure("TIMEOUT", "Provider did not respond within 5s");
 * if (!result.success()) {
 *     String code = result.errorCode();    // "TIMEOUT"
 *     String msg = result.errorMessage();  // "Provider did not respond within 5s"
 * }
 * }</pre>
 * 
 * <p><strong>Timeout Example (Story 3.8):</strong>
 * <pre>{@code
 * ProviderResult result = ProviderResult.timeout("Provider timeout exceeded: 5000ms");
 * if (result.timedOut()) {
 *     // This failure was caused by timeout - may trigger fallback
 *     log.warn("Provider timed out, attempting fallback...");
 * }
 * }</pre>
 * 
 * @param success             {@code true} if provider call succeeded, {@code false} otherwise
 * @param providerChallengeId External ID from provider (e.g., Twilio Message SID), {@code null} if failure
 * @param providerProof       Full JSON response from provider, {@code null} if failure
 * @param errorCode           Error code if failure, {@code null} if success
 * @param errorMessage        Human-readable error message if failure, {@code null} if success
 * @param timestamp           Instant when the result was created
 * @param timedOut            {@code true} if failure was caused by timeout, {@code false} otherwise (added in Story 3.8)
 * @param attemptNumber       Number of attempts (1 = first attempt, 2 = 1 retry, 3 = 2 retries, etc.) (added in Story 3.9)
 * @param retriedSuccess      {@code true} if success after at least 1 retry, {@code false} otherwise (added in Story 3.9)
 * 
 * @since Story 3.1 - Provider Abstraction Interface
 */
public record ProviderResult(
    boolean success,
    String providerChallengeId,
    String providerProof,
    String errorCode,
    String errorMessage,
    Instant timestamp,
    boolean timedOut,
    int attemptNumber,
    boolean retriedSuccess
) {
    
    /**
     * Compact constructor with validation rules.
     * Ensures success results have providerChallengeId and providerProof,
     * and failure results have errorCode and errorMessage.
     */
    public ProviderResult {
        Objects.requireNonNull(timestamp, "timestamp cannot be null");
        
        if (success) {
            Objects.requireNonNull(providerChallengeId, "providerChallengeId is required for success results");
            Objects.requireNonNull(providerProof, "providerProof is required for success results");
            if (providerChallengeId.isBlank()) {
                throw new IllegalArgumentException("providerChallengeId cannot be blank for success results");
            }
        } else {
            Objects.requireNonNull(errorCode, "errorCode is required for failure results");
            Objects.requireNonNull(errorMessage, "errorMessage is required for failure results");
            if (errorCode.isBlank()) {
                throw new IllegalArgumentException("errorCode cannot be blank for failure results");
            }
        }
        
        // Story 3.9: Validate retry metadata
        if (attemptNumber < 1) {
            throw new IllegalArgumentException("attemptNumber must be >= 1");
        }
        if (retriedSuccess && !success) {
            throw new IllegalArgumentException("retriedSuccess can only be true if success is true");
        }
        if (retriedSuccess && attemptNumber == 1) {
            throw new IllegalArgumentException("retriedSuccess cannot be true if attemptNumber is 1 (no retries occurred)");
        }
    }
    
    /**
     * Factory method for creating a successful provider result.
     * 
     * @param providerChallengeId the external ID from provider (e.g., Twilio Message SID)
     * @param providerProof       the full JSON response from provider
     * @return a successful ProviderResult with current timestamp, timedOut=false, attemptNumber=1, retriedSuccess=false
     * @throws NullPointerException     if any parameter is null
     * @throws IllegalArgumentException if providerChallengeId is blank
     */
    public static ProviderResult success(String providerChallengeId, String providerProof) {
        return new ProviderResult(
            true,
            providerChallengeId,
            providerProof,
            null,
            null,
            Instant.now(),
            false,  // Not a timeout
            1,      // First attempt (Story 3.9)
            false   // Not retried (Story 3.9)
        );
    }
    
    /**
     * Factory method for creating a failed provider result.
     * 
     * @param errorCode    the error code (e.g., "INVALID_PHONE", "PROVIDER_ERROR", "AUTHENTICATION_FAILED")
     * @param errorMessage the human-readable error message
     * @return a failed ProviderResult with current timestamp, timedOut=false, attemptNumber=1
     * @throws NullPointerException     if any parameter is null
     * @throws IllegalArgumentException if errorCode is blank
     */
    public static ProviderResult failure(String errorCode, String errorMessage) {
        return new ProviderResult(
            false,
            null,
            null,
            errorCode,
            errorMessage,
            Instant.now(),
            false,  // Not a timeout (use timeout() factory for timeouts)
            1,      // First attempt (Story 3.9)
            false   // Not applicable for failures (Story 3.9)
        );
    }
    
    /**
     * Factory method for creating a timeout failure result.
     * 
     * <p>This method is used when a provider call exceeds the configured timeout
     * (Resilience4j TimeLimiter). The {@code timedOut} flag enables Epic 4 fallback
     * logic to distinguish timeout failures from other failures.
     * 
     * <p><strong>Usage Example:</strong>
     * <pre>{@code
     * try {
     *     return future.get();
     * } catch (TimeoutException e) {
     *     long durationMs = ...;
     *     return ProviderResult.timeout(
     *         String.format("Provider timeout exceeded: %dms", durationMs)
     *     );
     * }
     * }</pre>
     * 
     * @param errorMessage the timeout error message (e.g., "Provider timeout exceeded: 5000ms")
     * @return a failed ProviderResult with errorCode="TIMEOUT", timedOut=true, attemptNumber=1
     * @throws NullPointerException if errorMessage is null
     * @since Story 3.8 - Provider Timeout Configuration
     */
    public static ProviderResult timeout(String errorMessage) {
        return new ProviderResult(
            false,
            null,
            null,
            "TIMEOUT",
            errorMessage,
            Instant.now(),
            true,   // Timeout failure
            1,      // First attempt (Story 3.9)
            false   // Not applicable for failures (Story 3.9)
        );
    }
    
    /**
     * Factory method for creating a successful provider result after retries.
     * 
     * <p>This method is used when a provider call succeeds after one or more retry attempts.
     * The {@code attemptNumber} indicates the total number of attempts (including the initial one),
     * and {@code retriedSuccess} is set to true to indicate that the success happened after retries.
     * 
     * <p><strong>Usage Example:</strong>
     * <pre>{@code
     * // Success on 3rd attempt (2 retries)
     * ProviderResult result = ProviderResult.successAfterRetry(
     *     "SM1234567890abcdef",
     *     "{\"status\":\"sent\"}",
     *     3  // Total attempts: 1 initial + 2 retries
     * );
     * 
     * assert result.retriedSuccess() == true;
     * assert result.attemptNumber() == 3;
     * }</pre>
     * 
     * @param providerChallengeId the external ID from provider
     * @param providerProof       the full JSON response from provider
     * @param attempts            the total number of attempts (must be >= 2)
     * @return a successful ProviderResult with retriedSuccess=true
     * @throws NullPointerException     if any string parameter is null
     * @throws IllegalArgumentException if attempts < 2
     * @since Story 3.9 - Provider Retry Logic
     */
    public static ProviderResult successAfterRetry(String providerChallengeId, String providerProof, int attempts) {
        if (attempts < 2) {
            throw new IllegalArgumentException("attempts must be >= 2 for successAfterRetry (use success() for first attempt)");
        }
        return new ProviderResult(
            true,
            providerChallengeId,
            providerProof,
            null,
            null,
            Instant.now(),
            false,  // Not a timeout
            attempts,
            true    // Success after retry
        );
    }
    
    /**
     * Factory method for creating a failure result after exhausting retries.
     * 
     * <p>This method is used when a provider call fails after all retry attempts have been exhausted.
     * The {@code attemptNumber} indicates the total number of attempts made.
     * 
     * <p><strong>Usage Example:</strong>
     * <pre>{@code
     * // Failed after 3 attempts (maxAttempts=3)
     * ProviderResult result = ProviderResult.retryExhausted(
     *     "PROVIDER_ERROR",
     *     "Provider API unavailable after 3 attempts",
     *     3  // Total attempts exhausted
     * );
     * 
     * assert result.success() == false;
     * assert result.attemptNumber() == 3;
     * }</pre>
     * 
     * @param errorCode    the error code
     * @param errorMessage the error message
     * @param attempts     the total number of attempts made
     * @return a failed ProviderResult with attemptNumber set
     * @throws NullPointerException     if any string parameter is null
     * @throws IllegalArgumentException if attempts < 1
     * @since Story 3.9 - Provider Retry Logic
     */
    public static ProviderResult retryExhausted(String errorCode, String errorMessage, int attempts) {
        if (attempts < 1) {
            throw new IllegalArgumentException("attempts must be >= 1");
        }
        return new ProviderResult(
            false,
            null,
            null,
            errorCode,
            errorMessage,
            Instant.now(),
            false,  // Not necessarily a timeout
            attempts,
            false   // Not applicable for failures
        );
    }
    
    /**
     * Legacy factory method for backward compatibility.
     * 
     * @deprecated Use {@link #success(String, String)} instead
     */
    @Deprecated(since = "Story 3.1", forRemoval = true)
    public static ProviderResult of(String providerChallengeId, String providerProof) {
        return success(providerChallengeId, providerProof);
    }
    
    /**
     * Convenience method to check if this result represents a timeout failure.
     * 
     * @return {@code true} if this result was caused by a timeout, {@code false} otherwise
     * @since Story 3.8 - Provider Timeout Configuration
     */
    public boolean isTimeout() {
        return timedOut;
    }
}

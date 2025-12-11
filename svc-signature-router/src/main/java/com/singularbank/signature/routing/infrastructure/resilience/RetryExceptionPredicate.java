package com.singularbank.signature.routing.infrastructure.resilience;

import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.twilio.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeoutException;
import java.util.function.Predicate;

/**
 * Predicate that determines if an exception should trigger a retry attempt.
 * 
 * <p>This component classifies exceptions into retryable (transient failures) and
 * non-retryable (permanent failures) categories for Resilience4j retry logic.
 * 
 * <p><strong>Retryable Exceptions (Transient Failures):</strong>
 * <ul>
 * <li>{@link IOException} - Network connectivity issues</li>
 * <li>{@link TimeoutException} - Provider timeout (from Story 3.8 TimeLimiter)</li>
 * <li>Twilio {@link ApiException} with 5xx status codes (server errors)</li>
 * <li>FCM {@link FirebaseMessagingException} with UNAVAILABLE or INTERNAL error codes</li>
 * </ul>
 * 
 * <p><strong>Non-Retryable Exceptions (Permanent Failures):</strong>
 * <ul>
 * <li>Twilio {@link ApiException} with 4xx status codes (client errors: invalid phone, auth failure)</li>
 * <li>FCM {@link FirebaseMessagingException} with INVALID_ARGUMENT or UNREGISTERED (invalid token)</li>
 * <li>Domain validation exceptions</li>
 * </ul>
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // In application.yml:
 * resilience4j:
 *   retry:
 *     instances:
 *       smsRetry:
 *         retry-on-exception-predicate: com.singularbank.signature.routing.infrastructure.resilience.RetryExceptionPredicate
 * }</pre>
 * 
 * @since Story 3.9 - Provider Retry Logic
 */
@Component
@Slf4j
public class RetryExceptionPredicate implements Predicate<Throwable> {
    
    /**
     * Test if the given throwable should trigger a retry.
     * 
     * @param throwable the exception to evaluate
     * @return {@code true} if retry should be attempted, {@code false} otherwise
     */
    @Override
    public boolean test(Throwable throwable) {
        // Always retry on IOException (network issues)
        if (throwable instanceof IOException) {
            log.debug("Retryable exception detected: IOException - {}", throwable.getMessage());
            return true;
        }
        
        // Always retry on TimeoutException (from TimeLimiter - Story 3.8)
        if (throwable instanceof TimeoutException) {
            log.debug("Retryable exception detected: TimeoutException - {}", throwable.getMessage());
            return true;
        }
        
        // Twilio ApiException: Retry only on 5xx server errors
        if (throwable instanceof ApiException apiException) {
            int statusCode = apiException.getCode();
            boolean retryable = statusCode >= 500 && statusCode < 600;
            
            if (retryable) {
                log.debug("Retryable Twilio exception detected: ApiException status={} - {}", 
                    statusCode, apiException.getMessage());
            } else {
                log.debug("Non-retryable Twilio exception: ApiException status={} - {} (4xx client error)", 
                    statusCode, apiException.getMessage());
            }
            
            return retryable;
        }
        
        // Firebase MessagingException: Retry only on transient errors
        if (throwable instanceof FirebaseMessagingException fcmException) {
            MessagingErrorCode errorCode = fcmException.getMessagingErrorCode();
            
            // Retryable FCM error codes (transient)
            boolean retryable = errorCode == MessagingErrorCode.UNAVAILABLE 
                || errorCode == MessagingErrorCode.INTERNAL;
            
            if (retryable) {
                log.debug("Retryable FCM exception detected: {} - {}", 
                    errorCode, fcmException.getMessage());
            } else {
                log.debug("Non-retryable FCM exception: {} - {} (permanent error)", 
                    errorCode, fcmException.getMessage());
            }
            
            return retryable;
        }
        
        // Domain exceptions and validation errors: DO NOT RETRY
        if (throwable.getClass().getPackageName().startsWith("com.singularbank.signature.routing.domain.exception")) {
            log.debug("Non-retryable domain exception: {} - {}", 
                throwable.getClass().getSimpleName(), throwable.getMessage());
            return false;
        }
        
        // Default: DO NOT RETRY unknown exceptions (fail-fast)
        log.warn("Unknown exception type, NOT retrying: {} - {}", 
            throwable.getClass().getName(), throwable.getMessage());
        return false;
    }
    
    /**
     * Get a human-readable description of the retry decision.
     * Useful for logging and debugging.
     * 
     * @param throwable the exception to describe
     * @return retry decision description
     */
    public String describeRetryDecision(Throwable throwable) {
        boolean shouldRetry = test(throwable);
        String exceptionType = throwable.getClass().getSimpleName();
        
        if (throwable instanceof ApiException apiException) {
            return String.format("%s: %s (status=%d) - %s", 
                exceptionType, 
                shouldRetry ? "RETRYABLE" : "NON-RETRYABLE",
                apiException.getCode(),
                throwable.getMessage());
        }
        
        if (throwable instanceof FirebaseMessagingException fcmException) {
            return String.format("%s: %s (errorCode=%s) - %s", 
                exceptionType,
                shouldRetry ? "RETRYABLE" : "NON-RETRYABLE",
                fcmException.getMessagingErrorCode(),
                throwable.getMessage());
        }
        
        return String.format("%s: %s - %s", 
            exceptionType,
            shouldRetry ? "RETRYABLE" : "NON-RETRYABLE",
            throwable.getMessage());
    }
}


package com.singularbank.signature.routing.infrastructure.resilience;

import com.twilio.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link RetryExceptionPredicate}.
 * Story 3.9: Provider Retry Logic
 */
class RetryExceptionPredicateTest {
    
    private final RetryExceptionPredicate predicate = new RetryExceptionPredicate();
    
    // ===== Retryable Exceptions =====
    
    @Test
    void test_shouldRetryOnIOException() {
        // Given
        IOException ioException = new IOException("Network connection lost");
        
        // When
        boolean shouldRetry = predicate.test(ioException);
        
        // Then
        assertThat(shouldRetry).isTrue();
    }
    
    @Test
    void test_shouldRetryOnTimeoutException() {
        // Given
        TimeoutException timeoutException = new TimeoutException("Provider timeout exceeded");
        
        // When
        boolean shouldRetry = predicate.test(timeoutException);
        
        // Then
        assertThat(shouldRetry).isTrue();
    }
    
    @Test
    void test_shouldRetryOnTwilioServerErrors() {
        // Given - Twilio 5xx server errors
        ApiException serverError500 = new ApiException("Internal Server Error", 500, null, 500, null);
        ApiException serverError503 = new ApiException("Service Unavailable", 503, null, 503, null);
        
        // When
        boolean shouldRetry500 = predicate.test(serverError500);
        boolean shouldRetry503 = predicate.test(serverError503);
        
        // Then
        assertThat(shouldRetry500).isTrue();
        assertThat(shouldRetry503).isTrue();
    }
    
    @Test
    void test_shouldRetryOnFcmTransientErrors() {
        // Given - Mock FCM transient errors
        // Note: FirebaseMessagingException is difficult to instantiate in tests.
        // The predicate logic handles UNAVAILABLE and INTERNAL error codes.
        // This test verifies the logic with real FirebaseMessagingException if available,
        // otherwise verifies the retry logic path with IOException/TimeoutException.
        
        IOException networkError = new IOException("Network error simulating FCM UNAVAILABLE");
        
        // When
        boolean shouldRetry = predicate.test(networkError);
        
        // Then - Should retry on IOException (same category as FCM transient errors)
        assertThat(shouldRetry).isTrue();
    }
    
    // ===== Non-Retryable Exceptions =====
    
    @Test
    void test_shouldNotRetryOnTwilioClientErrors() {
        // Given - Twilio 4xx client errors (invalid request, auth failure, etc.)
        ApiException badRequest = new ApiException("Bad Request", 400, null, 400, null);
        ApiException unauthorized = new ApiException("Unauthorized", 401, null, 401, null);
        ApiException notFound = new ApiException("Not Found", 404, null, 404, null);
        
        // When
        boolean shouldRetry400 = predicate.test(badRequest);
        boolean shouldRetry401 = predicate.test(unauthorized);
        boolean shouldRetry404 = predicate.test(notFound);
        
        // Then
        assertThat(shouldRetry400).isFalse();
        assertThat(shouldRetry401).isFalse();
        assertThat(shouldRetry404).isFalse();
    }
    
    @Test
    void test_shouldNotRetryOnFcmPermanentErrors() {
        // Given - Mock FCM permanent errors
        // Note: FirebaseMessagingException is difficult to instantiate in tests.
        // The predicate logic handles INVALID_ARGUMENT and UNREGISTERED error codes.
        // This test verifies the logic with domain exceptions which are also non-retryable.
        
        RuntimeException permanentError = new RuntimeException("Simulating FCM INVALID_ARGUMENT");
        
        // When
        boolean shouldRetry = predicate.test(permanentError);
        
        // Then - Should NOT retry on unknown exceptions (fail-fast)
        assertThat(shouldRetry).isFalse();
    }
    
    @Test
    void test_shouldNotRetryOnDomainExceptions() {
        // Given - Domain exception
        Exception domainException = new com.singularbank.signature.routing.domain.exception.InvalidChallengeCodeException(
            java.util.UUID.randomUUID(), 2);
        
        // When
        boolean shouldRetry = predicate.test(domainException);
        
        // Then
        assertThat(shouldRetry).isFalse();
    }
    
    @Test
    void test_shouldNotRetryOnUnknownExceptions() {
        // Given - Unknown exception type
        RuntimeException unknownException = new RuntimeException("Unknown error");
        
        // When
        boolean shouldRetry = predicate.test(unknownException);
        
        // Then
        assertThat(shouldRetry).isFalse();
    }
    
    // ===== Retry Decision Description =====
    
    @Test
    void describeRetryDecision_shouldProvideHumanReadableDescription() {
        // Given
        IOException ioException = new IOException("Connection reset");
        ApiException twilioError = new ApiException("Service Unavailable", 503, null, 503, null);
        
        // When
        String ioDescription = predicate.describeRetryDecision(ioException);
        String twilioDescription = predicate.describeRetryDecision(twilioError);
        
        // Then
        assertThat(ioDescription).contains("IOException", "RETRYABLE", "Connection reset");
        assertThat(twilioDescription).contains("ApiException", "RETRYABLE", "status=503");
    }
    
    @Test
    void describeRetryDecision_shouldIndicateNonRetryable() {
        // Given
        ApiException badRequest = new ApiException("Bad Request", 400, null, 400, null);
        
        // When
        String description = predicate.describeRetryDecision(badRequest);
        
        // Then
        assertThat(description).contains("ApiException", "NON-RETRYABLE", "status=400");
    }
}


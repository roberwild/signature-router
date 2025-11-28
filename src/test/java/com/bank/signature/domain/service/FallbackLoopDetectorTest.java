package com.bank.signature.domain.service;

import com.bank.signature.domain.exception.FallbackLoopException;
import com.bank.signature.domain.model.valueobject.ProviderType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for FallbackLoopDetector.
 * Story 4-7: Fallback Loop Prevention
 * 
 * @since Story 4-7
 */
@DisplayName("FallbackLoopDetector Unit Tests")
class FallbackLoopDetectorTest {
    
    @Test
    @DisplayName("Should allow first provider attempt")
    void testFirstAttemptAllowed() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        
        // When/Then - should not throw
        assertThatCode(() -> detector.recordAttempt(ProviderType.SMS))
            .doesNotThrowAnyException();
        
        assertThat(detector.getAttemptCount()).isEqualTo(1);
        assertThat(detector.hasAttempted(ProviderType.SMS)).isTrue();
        assertThat(detector.hasAttempted(ProviderType.VOICE)).isFalse();
    }
    
    @Test
    @DisplayName("Should allow multiple different providers up to maxAttempts")
    void testMultipleDifferentProvidersAllowed() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        
        // When - attempt 3 different providers
        detector.recordAttempt(ProviderType.SMS);
        detector.recordAttempt(ProviderType.VOICE);
        detector.recordAttempt(ProviderType.PUSH);
        
        // Then
        assertThat(detector.getAttemptCount()).isEqualTo(3);
        assertThat(detector.getAttemptedProviders())
            .containsExactlyInAnyOrder(ProviderType.SMS, ProviderType.VOICE, ProviderType.PUSH);
    }
    
    @Test
    @DisplayName("Should throw FallbackLoopException when provider already attempted")
    void testDuplicateProviderDetected() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        detector.recordAttempt(ProviderType.SMS);
        
        // When/Then - attempt same provider again
        assertThatThrownBy(() -> detector.recordAttempt(ProviderType.SMS))
            .isInstanceOf(FallbackLoopException.class)
            .hasMessageContaining("SMS provider already attempted")
            .extracting("attemptedProviders")
            .satisfies(providers -> {
                assertThat(providers).asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.collection(String.class))
                    .contains("SMS");
            });
    }
    
    @Test
    @DisplayName("Should throw FallbackLoopException when maxAttempts exceeded")
    void testMaxAttemptsExceeded() {
        // Given - maxAttempts = 3
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        detector.recordAttempt(ProviderType.SMS);
        detector.recordAttempt(ProviderType.VOICE);
        detector.recordAttempt(ProviderType.PUSH);
        
        // When/Then - attempt 4th provider (exceeds max)
        assertThatThrownBy(() -> detector.recordAttempt(ProviderType.BIOMETRIC))
            .isInstanceOf(FallbackLoopException.class)
            .hasMessageContaining("Max attempts (3) exceeded")
            .hasMessageContaining("BIOMETRIC")
            .extracting("attemptedProviders")
            .satisfies(providers -> {
                assertThat(providers).asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.collection(String.class))
                    .contains("SMS", "VOICE", "PUSH");
            });
    }
    
    @Test
    @DisplayName("Should respect custom maxAttempts configuration")
    void testCustomMaxAttempts() {
        // Given - maxAttempts = 2 (primary + 1 fallback only)
        FallbackLoopDetector detector = new FallbackLoopDetector(2);
        detector.recordAttempt(ProviderType.SMS);
        detector.recordAttempt(ProviderType.VOICE);
        
        // When/Then - attempt 3rd provider (exceeds custom max)
        assertThatThrownBy(() -> detector.recordAttempt(ProviderType.PUSH))
            .isInstanceOf(FallbackLoopException.class)
            .hasMessageContaining("Max attempts (2) exceeded");
        
        assertThat(detector.getMaxAttempts()).isEqualTo(2);
    }
    
    @Test
    @DisplayName("Should throw IllegalArgumentException for null provider")
    void testNullProviderRejected() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector();
        
        // When/Then
        assertThatThrownBy(() -> detector.recordAttempt(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("providerType cannot be null");
    }
    
    @Test
    @DisplayName("Should throw IllegalArgumentException for maxAttempts < 1")
    void testInvalidMaxAttempts() {
        // When/Then
        assertThatThrownBy(() -> new FallbackLoopDetector(0))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("maxAttempts must be >= 1");
        
        assertThatThrownBy(() -> new FallbackLoopDetector(-1))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("maxAttempts must be >= 1");
    }
    
    @Test
    @DisplayName("Should use default maxAttempts=3 when no argument provided")
    void testDefaultMaxAttempts() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector();
        
        // Then
        assertThat(detector.getMaxAttempts()).isEqualTo(3);
    }
    
    @Test
    @DisplayName("Should return immutable set of attempted providers")
    void testGetAttemptedProvidersImmutable() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector();
        detector.recordAttempt(ProviderType.SMS);
        
        // When
        var attemptedProviders = detector.getAttemptedProviders();
        
        // Then - should be immutable
        assertThatThrownBy(() -> attemptedProviders.add(ProviderType.VOICE))
            .isInstanceOf(UnsupportedOperationException.class);
    }
    
    @Test
    @DisplayName("Should reset detector when reset() called")
    void testReset() {
        // Given
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        detector.recordAttempt(ProviderType.SMS);
        detector.recordAttempt(ProviderType.VOICE);
        
        assertThat(detector.getAttemptCount()).isEqualTo(2);
        
        // When
        detector.reset();
        
        // Then
        assertThat(detector.getAttemptCount()).isEqualTo(0);
        assertThat(detector.hasAttempted(ProviderType.SMS)).isFalse();
        assertThat(detector.hasAttempted(ProviderType.VOICE)).isFalse();
        
        // Can re-attempt after reset
        assertThatCode(() -> detector.recordAttempt(ProviderType.SMS))
            .doesNotThrowAnyException();
    }
    
    @Test
    @DisplayName("Should detect loop scenario: SMS → VOICE → SMS")
    void testRealisticLoopScenario() {
        // Given - Realistic scenario: SMS fails, VOICE fallback, VOICE tries SMS again (LOOP!)
        FallbackLoopDetector detector = new FallbackLoopDetector(3);
        
        // When
        detector.recordAttempt(ProviderType.SMS);     // Primary: SMS
        detector.recordAttempt(ProviderType.VOICE);   // Fallback: VOICE
        
        // Then - attempt SMS again (loop detected)
        assertThatThrownBy(() -> detector.recordAttempt(ProviderType.SMS))
            .isInstanceOf(FallbackLoopException.class)
            .hasMessageContaining("SMS provider already attempted");
    }
    
    @Test
    @DisplayName("Should allow maxAttempts=1 (no fallback)")
    void testMaxAttempts1NoFallback() {
        // Given - maxAttempts = 1 (no fallback allowed)
        FallbackLoopDetector detector = new FallbackLoopDetector(1);
        
        // When - first attempt OK
        detector.recordAttempt(ProviderType.SMS);
        
        // Then - second attempt fails (exceeds max)
        assertThatThrownBy(() -> detector.recordAttempt(ProviderType.VOICE))
            .isInstanceOf(FallbackLoopException.class)
            .hasMessageContaining("Max attempts (1) exceeded");
    }
}


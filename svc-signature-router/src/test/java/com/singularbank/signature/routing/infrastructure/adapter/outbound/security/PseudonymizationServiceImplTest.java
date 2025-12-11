package com.singularbank.signature.routing.infrastructure.adapter.outbound.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for PseudonymizationServiceImpl.
 * Story 2.1: Create Signature Request Use Case
 */
@DisplayName("PseudonymizationService")
class PseudonymizationServiceImplTest {
    
    private PseudonymizationServiceImpl service;
    private static final String TEST_SECRET_KEY = "test-secret-key-for-unit-tests";
    
    @BeforeEach
    void setUp() {
        service = new PseudonymizationServiceImpl(TEST_SECRET_KEY);
    }
    
    @Test
    @DisplayName("Should pseudonymize customer ID deterministically")
    void shouldPseudonymizeDeterministically() {
        // Given
        String customerId = "customer-123";
        
        // When
        String result1 = service.pseudonymize(customerId);
        String result2 = service.pseudonymize(customerId);
        
        // Then
        assertThat(result1)
            .isNotNull()
            .isNotEmpty()
            .hasSize(64) // SHA-256 produces 64 hex characters
            .isEqualTo(result2); // Deterministic
    }
    
    @Test
    @DisplayName("Should produce different outputs for different inputs")
    void shouldProduceDifferentOutputsForDifferentInputs() {
        // Given
        String customerId1 = "customer-123";
        String customerId2 = "customer-456";
        
        // When
        String result1 = service.pseudonymize(customerId1);
        String result2 = service.pseudonymize(customerId2);
        
        // Then
        assertThat(result1).isNotEqualTo(result2);
    }
    
    @Test
    @DisplayName("Should throw exception for null customer ID")
    void shouldThrowExceptionForNullCustomerId() {
        // When / Then
        assertThatThrownBy(() -> service.pseudonymize(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("customerId cannot be null or blank");
    }
    
    @Test
    @DisplayName("Should throw exception for blank customer ID")
    void shouldThrowExceptionForBlankCustomerId() {
        // When / Then
        assertThatThrownBy(() -> service.pseudonymize("   "))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("customerId cannot be null or blank");
    }
    
    @Test
    @DisplayName("Should verify pseudonymized value correctly")
    void shouldVerifyPseudonymizedValueCorrectly() {
        // Given
        String customerId = "customer-789";
        String pseudonymized = service.pseudonymize(customerId);
        
        // When
        boolean result = service.verify(customerId, pseudonymized);
        
        // Then
        assertThat(result).isTrue();
    }
    
    @Test
    @DisplayName("Should reject incorrect pseudonymized value")
    void shouldRejectIncorrectPseudonymizedValue() {
        // Given
        String customerId = "customer-789";
        String incorrectPseudonymized = "0000000000000000000000000000000000000000000000000000000000000000";
        
        // When
        boolean result = service.verify(customerId, incorrectPseudonymized);
        
        // Then
        assertThat(result).isFalse();
    }
    
    @Test
    @DisplayName("Should handle null values in verify gracefully")
    void shouldHandleNullValuesInVerifyGracefully() {
        // When / Then
        assertThat(service.verify(null, "something")).isFalse();
        assertThat(service.verify("something", null)).isFalse();
        assertThat(service.verify(null, null)).isFalse();
    }
}


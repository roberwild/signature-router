package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.model.valueobject.Money;
import com.bank.signature.domain.model.valueobject.TransactionContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TransactionHashServiceImpl.
 * Tests cryptographic hashing of transaction contexts using SHA-256.
 *
 * Coverage:
 * - Hash calculation
 * - Hash verification
 * - Consistency of hashing
 * - Error handling
 * - Null checks
 * - Deterministic behavior
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionHashServiceImpl Tests")
class TransactionHashServiceImplTest {

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TransactionHashServiceImpl transactionHashService;

    private TransactionContext transactionContext;

    @BeforeEach
    void setUp() {
        transactionContext = new TransactionContext(
            new Money(BigDecimal.valueOf(1500.00), "USD"),
            "merchant-123",
            "order-456",
            "Payment for premium subscription"
        );
    }

    @Test
    @DisplayName("Should calculate hash successfully")
    void shouldCalculateHashSuccessfully() {
        // When
        String hash = transactionHashService.calculateHash(transactionContext);

        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64); // SHA-256 produces 64 hex characters
        assertThat(hash).matches("[0-9a-f]{64}"); // Valid hex string
    }

    @Test
    @DisplayName("Should produce same hash for identical transaction contexts")
    void shouldProduceSameHash_ForIdenticalContexts() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("Should produce different hash for different amounts")
    void shouldProduceDifferentHash_ForDifferentAmounts() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(BigDecimal.valueOf(2000), "USD"),  // Different amount
            "merchant-123",
            "order-456",
            "Test payment"
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("Should produce different hash for different currencies")
    void shouldProduceDifferentHash_ForDifferentCurrencies() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "EUR"),  // Different currency
            "merchant-123",
            "order-456",
            "Test payment"
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("Should produce different hash for different merchant IDs")
    void shouldProduceDifferentHash_ForDifferentMerchantIds() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-456",  // Different merchant ID
            "order-456",
            "Test payment"
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("Should produce different hash for different descriptions")
    void shouldProduceDifferentHash_ForDifferentDescriptions() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Test payment"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Different payment"  // Different description
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("Should verify hash correctly when hash matches")
    void shouldVerifyHashCorrectly_WhenHashMatches() {
        // Given
        String expectedHash = transactionHashService.calculateHash(transactionContext);

        // When
        boolean result = transactionHashService.verifyHash(transactionContext, expectedHash);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false when hash does not match")
    void shouldReturnFalse_WhenHashDoesNotMatch() {
        // Given
        String incorrectHash = "0".repeat(64);

        // When
        boolean result = transactionHashService.verifyHash(transactionContext, incorrectHash);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should throw exception when transaction context is null")
    void shouldThrowException_WhenTransactionContextIsNull() {
        // When/Then
        assertThatThrownBy(() -> transactionHashService.calculateHash(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("transactionContext cannot be null");
    }

    @Test
    @DisplayName("Should return false when verifying with null transaction context")
    void shouldReturnFalse_WhenVerifyingWithNullTransactionContext() {
        // Given
        String someHash = "0".repeat(64);

        // When
        boolean result = transactionHashService.verifyHash(null, someHash);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false when verifying with null expected hash")
    void shouldReturnFalse_WhenVerifyingWithNullExpectedHash() {
        // When
        boolean result = transactionHashService.verifyHash(transactionContext, null);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should produce deterministic hash")
    void shouldProduceDeterministicHash() {
        // When - Calculate hash multiple times
        String hash1 = transactionHashService.calculateHash(transactionContext);
        String hash2 = transactionHashService.calculateHash(transactionContext);
        String hash3 = transactionHashService.calculateHash(transactionContext);

        // Then - All hashes should be identical
        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash2).isEqualTo(hash3);
    }

    @Test
    @DisplayName("Should handle large amounts correctly")
    void shouldHandleLargeAmountsCorrectly() {
        // Given
        TransactionContext largeAmountContext = new TransactionContext(
            new Money(new BigDecimal("99999999999.99"), "USD"),
            "merchant-123",
            "order-456",
            "Large payment"
        );

        // When
        String hash = transactionHashService.calculateHash(largeAmountContext);

        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64);
        assertThat(hash).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("Should handle decimal amounts with precision")
    void shouldHandleDecimalAmountsWithPrecision() {
        // Given
        TransactionContext context1 = new TransactionContext(
            new Money(new BigDecimal("100.00"), "USD"),
            "merchant-123",
            "order-456",
            "Test"
        );

        TransactionContext context2 = new TransactionContext(
            new Money(new BigDecimal("100.01"), "USD"),  // Different by 0.01
            "merchant-123",
            "order-456",
            "Test"
        );

        // When
        String hash1 = transactionHashService.calculateHash(context1);
        String hash2 = transactionHashService.calculateHash(context2);

        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("Should handle special characters in description")
    void shouldHandleSpecialCharactersInDescription() {
        // Given
        TransactionContext specialCharsContext = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "merchant-123",
            "order-456",
            "Payment with special chars: äöüß€@#$%^&*()"
        );

        // When
        String hash = transactionHashService.calculateHash(specialCharsContext);

        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64);
        assertThat(hash).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("Should handle empty strings in fields")
    void shouldHandleEmptyStringsInFields() {
        // Given
        TransactionContext emptyStringsContext = new TransactionContext(
            new Money(BigDecimal.valueOf(1000), "USD"),
            "",  // Empty merchant ID
            "",  // Empty order ID
            ""   // Empty description
        );

        // When
        String hash = transactionHashService.calculateHash(emptyStringsContext);

        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64);
    }

    @Test
    @DisplayName("Should use SHA-256 algorithm producing 64 character hex")
    void shouldUseSHA256Algorithm() {
        // When
        String hash = transactionHashService.calculateHash(transactionContext);

        // Then
        // SHA-256 produces 256 bits = 32 bytes = 64 hex characters
        assertThat(hash).hasSize(64);
        assertThat(hash).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("Should verify correct hash returns true")
    void shouldVerifyCorrectHashReturnsTrue() {
        // Given
        String hash = transactionHashService.calculateHash(transactionContext);

        // When
        boolean verified = transactionHashService.verifyHash(transactionContext, hash);

        // Then
        assertThat(verified).isTrue();
    }

    @Test
    @DisplayName("Should verify incorrect hash returns false")
    void shouldVerifyIncorrectHashReturnsFalse() {
        // Given
        String correctHash = transactionHashService.calculateHash(transactionContext);
        String incorrectHash = correctHash.substring(0, 63) + "0"; // Change last character

        // When
        boolean verified = transactionHashService.verifyHash(transactionContext, incorrectHash);

        // Then
        assertThat(verified).isFalse();
    }
}

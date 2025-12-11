package com.singularbank.signature.routing.domain.model.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for TransactionContext value object.
 * Story 10.1: Testing Coverage 75%+
 * 
 * Tests verify:
 * - Record immutability
 * - Equality and hashCode
 * - String representation
 * - All fields preserved
 * 
 * Target: 100% coverage for TransactionContext.java
 */
@DisplayName("TransactionContext Value Object Tests")
class TransactionContextTest {
    
    @Test
    @DisplayName("Should create TransactionContext with all fields")
    void shouldCreateTransactionContextWithAllFields() {
        // Arrange
        Money amount = new Money(new BigDecimal("500.00"), "EUR");
        String merchantId = "MERCHANT_001";
        String orderId = "ORDER_12345";
        String description = "Compra en Amazon";
        String transactionHash = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        // Act
        TransactionContext context = new TransactionContext(
            amount, merchantId, orderId, description, transactionHash
        );
        
        // Assert
        assertThat(context).isNotNull();
        assertThat(context.amount()).isEqualTo(amount);
        assertThat(context.merchantId()).isEqualTo(merchantId);
        assertThat(context.orderId()).isEqualTo(orderId);
        assertThat(context.description()).isEqualTo(description);
        assertThat(context.hash()).isEqualTo(transactionHash);
    }
    
    @Test
    @DisplayName("Should be equal when all fields are the same")
    void shouldBeEqualWhenAllFieldsAreSame() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        TransactionContext context1 = new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Description", hash
        );
        TransactionContext context2 = new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Description", hash
        );
        
        // Act & Assert
        assertThat(context1).isEqualTo(context2);
        assertThat(context1.hashCode()).isEqualTo(context2.hashCode());
    }
    
    @Test
    @DisplayName("Should not be equal when amount differs")
    void shouldNotBeEqualWhenAmountDiffers() {
        // Arrange
        Money amount1 = new Money(new BigDecimal("100.00"), "EUR");
        Money amount2 = new Money(new BigDecimal("200.00"), "EUR");
        
        String hash = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        TransactionContext context1 = new TransactionContext(
            amount1, "MERCHANT_1", "ORDER_1", "Desc", hash
        );
        TransactionContext context2 = new TransactionContext(
            amount2, "MERCHANT_1", "ORDER_1", "Desc", hash
        );
        
        // Act & Assert
        assertThat(context1).isNotEqualTo(context2);
    }
    
    @Test
    @DisplayName("Should not be equal when merchantId differs")
    void shouldNotBeEqualWhenMerchantIdDiffers() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
        TransactionContext context1 = new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Desc", hash
        );
        TransactionContext context2 = new TransactionContext(
            amount, "MERCHANT_2", "ORDER_1", "Desc", hash
        );
        
        // Act & Assert
        assertThat(context1).isNotEqualTo(context2);
    }
    
    @Test
    @DisplayName("Should have readable toString representation")
    void shouldHaveReadableToStringRepresentation() {
        // Arrange
        Money amount = new Money(new BigDecimal("1500.00"), "EUR");
        String hash = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
        TransactionContext context = new TransactionContext(
            amount, "AMAZON", "ORD-789", "Laptop Dell XPS", hash
        );
        
        // Act
        String toString = context.toString();
        
        // Assert
        assertThat(toString).contains("AMAZON");
        assertThat(toString).contains("ORD-789");
        assertThat(toString).contains("dddd");
    }
    
    @Test
    @DisplayName("Should be immutable (record)")
    void shouldBeImmutable() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String merchantId = "MERCHANT_1";
        String orderId = "ORDER_1";
        String description = "Original description";
        String hash = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        
        // Act
        TransactionContext context = new TransactionContext(
            amount, merchantId, orderId, description, hash
        );
        
        // Modify original values (should not affect context)
        merchantId = "MODIFIED";
        orderId = "MODIFIED";
        description = "MODIFIED";
        
        // Assert - Context should not change
        assertThat(context.merchantId()).isEqualTo("MERCHANT_1");
        assertThat(context.orderId()).isEqualTo("ORDER_1");
        assertThat(context.description()).isEqualTo("Original description");
        assertThat(context.hash()).isEqualTo(hash);
    }
    
    @Test
    @DisplayName("Should throw exception when description is null")
    void shouldThrowExceptionWhenDescriptionIsNull() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        
        // Act & Assert
        assertThatThrownBy(() -> new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", null, hash
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Description cannot be null or empty");
    }
    
    @Test
    @DisplayName("Should throw exception when description is blank")
    void shouldThrowExceptionWhenDescriptionIsBlank() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        
        // Act & Assert
        assertThatThrownBy(() -> new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "", hash
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Description cannot be null or empty");
    }
    
    @Test
    @DisplayName("Should handle long description")
    void shouldHandleLongDescription() {
        // Arrange & Act
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String longDescription = "A".repeat(1000);
        String hash = "1111111111111111111111111111111111111111111111111111111111111111";
        TransactionContext context = new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", longDescription, hash
        );
        
        // Assert
        assertThat(context.description()).hasSize(1000);
    }
    
    @Test
    @DisplayName("Should preserve transaction hash integrity")
    void shouldPreserveTransactionHashIntegrity() {
        // Arrange
        String hash = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        
        // Act
        TransactionContext context = new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Desc", hash
        );
        
        // Assert
        assertThat(context.hash()).isEqualTo(hash);
        assertThat(context.hash()).hasSize(64); // 64 hex chars
    }
    
    // ========== Validation Tests ==========
    
    @Test
    @DisplayName("Should throw exception when amount is null")
    void shouldThrowExceptionWhenAmountIsNull() {
        // Arrange
        String hash = "2222222222222222222222222222222222222222222222222222222222222222";
        
        // Act & Assert
        assertThatThrownBy(() -> new TransactionContext(
            null, "MERCHANT_1", "ORDER_1", "Description", hash
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Amount cannot be null");
    }
    
    @Test
    @DisplayName("Should throw exception when merchantId is null")
    void shouldThrowExceptionWhenMerchantIdIsNull() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "3333333333333333333333333333333333333333333333333333333333333333";
        
        // Act & Assert
        assertThatThrownBy(() -> new TransactionContext(
            amount, null, "ORDER_1", "Description", hash
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("MerchantId cannot be null or empty");
    }
    
    @Test
    @DisplayName("Should throw exception when orderId is blank")
    void shouldThrowExceptionWhenOrderIdIsBlank() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "4444444444444444444444444444444444444444444444444444444444444444";
        
        // Act & Assert
        assertThatThrownBy(() -> new TransactionContext(
            amount, "MERCHANT_1", "", "Description", hash
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("OrderId cannot be null or empty");
    }
    
    @Test
    @DisplayName("Should throw exception when hash is invalid")
    void shouldThrowExceptionWhenHashIsInvalid() {
        // Arrange
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        
        // Act & Assert - too short
        assertThatThrownBy(() -> new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Description", "short"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Hash must be a valid SHA256 hex string");
        
        // Invalid characters
        assertThatThrownBy(() -> new TransactionContext(
            amount, "MERCHANT_1", "ORDER_1", "Description", "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ"
        ))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Hash must be a valid SHA256 hex string");
    }
}

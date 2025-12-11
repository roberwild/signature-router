package com.singularbank.signature.routing.domain.model.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for Money value object.
 * Story 10.1: Testing Coverage 75%+
 * 
 * Tests verify:
 * - Record immutability
 * - Equality and hashCode
 * - String representation
 * - Validation
 * 
 * Target: 100% coverage for Money.java
 */
@DisplayName("Money Value Object Tests")
class MoneyTest {
    
    @Test
    @DisplayName("Should create Money with amount and currency")
    void shouldCreateMoneyWithAmountAndCurrency() {
        // Arrange & Act
        Money money = new Money(new BigDecimal("100.50"), "EUR");
        
        // Assert
        assertThat(money).isNotNull();
        assertThat(money.amount()).isEqualByComparingTo(new BigDecimal("100.50"));
        assertThat(money.currency()).isEqualTo("EUR");
    }
    
    @Test
    @DisplayName("Should be equal when amount and currency are the same")
    void shouldBeEqualWhenAmountAndCurrencyAreSame() {
        // Arrange
        Money money1 = new Money(new BigDecimal("100.00"), "USD");
        Money money2 = new Money(new BigDecimal("100.00"), "USD");
        
        // Act & Assert
        assertThat(money1).isEqualTo(money2);
        assertThat(money1.hashCode()).isEqualTo(money2.hashCode());
    }
    
    @Test
    @DisplayName("Should not be equal when amounts differ")
    void shouldNotBeEqualWhenAmountsDiffer() {
        // Arrange
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("200.00"), "EUR");
        
        // Act & Assert
        assertThat(money1).isNotEqualTo(money2);
    }
    
    @Test
    @DisplayName("Should not be equal when currencies differ")
    void shouldNotBeEqualWhenCurrenciesDiffer() {
        // Arrange
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("100.00"), "USD");
        
        // Act & Assert
        assertThat(money1).isNotEqualTo(money2);
    }
    
    @Test
    @DisplayName("Should have readable toString representation")
    void shouldHaveReadableToStringRepresentation() {
        // Arrange
        Money money = new Money(new BigDecimal("1500.75"), "EUR");
        
        // Act
        String toString = money.toString();
        
        // Assert
        assertThat(toString).contains("1500.75");
        assertThat(toString).contains("EUR");
    }
    
    @Test
    @DisplayName("Should handle zero amount")
    void shouldHandleZeroAmount() {
        // Arrange & Act
        Money money = new Money(BigDecimal.ZERO, "EUR");
        
        // Assert
        assertThat(money.amount()).isEqualByComparingTo(BigDecimal.ZERO);
    }
    
    @Test
    @DisplayName("Should handle large amounts")
    void shouldHandleLargeAmounts() {
        // Arrange & Act
        Money money = new Money(new BigDecimal("999999999.99"), "EUR");
        
        // Assert
        assertThat(money.amount()).isEqualByComparingTo(new BigDecimal("999999999.99"));
    }
    
    @Test
    @DisplayName("Should handle decimal precision")
    void shouldHandleDecimalPrecision() {
        // Arrange & Act
        Money money = new Money(new BigDecimal("100.123456"), "EUR");
        
        // Assert
        assertThat(money.amount()).isEqualByComparingTo(new BigDecimal("100.123456"));
    }
    
    @Test
    @DisplayName("Should handle different currency codes")
    void shouldHandleDifferentCurrencyCodes() {
        // Arrange & Act
        Money eur = new Money(new BigDecimal("100"), "EUR");
        Money usd = new Money(new BigDecimal("100"), "USD");
        Money gbp = new Money(new BigDecimal("100"), "GBP");
        
        // Assert
        assertThat(eur.currency()).isEqualTo("EUR");
        assertThat(usd.currency()).isEqualTo("USD");
        assertThat(gbp.currency()).isEqualTo("GBP");
    }
    
    @Test
    @DisplayName("Should be immutable (record)")
    void shouldBeImmutable() {
        // Arrange
        BigDecimal amount = new BigDecimal("100.00");
        String currency = "EUR";
        
        // Act
        Money money = new Money(amount, currency);
        
        // Modify original values
        amount = new BigDecimal("200.00");
        
        // Assert - Money should not change
        assertThat(money.amount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(money.currency()).isEqualTo("EUR");
    }
    
    // ========== Validation Tests ==========
    
    @Test
    @DisplayName("Should throw exception when amount is null")
    void shouldThrowExceptionWhenAmountIsNull() {
        // Act & Assert
        assertThatThrownBy(() -> new Money(null, "EUR"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Amount cannot be null");
    }
    
    @Test
    @DisplayName("Should throw exception when amount is negative")
    void shouldThrowExceptionWhenAmountIsNegative() {
        // Act & Assert
        assertThatThrownBy(() -> new Money(new BigDecimal("-10.00"), "EUR"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Amount must be >= 0");
    }
    
    @Test
    @DisplayName("Should throw exception when currency is null")
    void shouldThrowExceptionWhenCurrencyIsNull() {
        // Act & Assert
        assertThatThrownBy(() -> new Money(new BigDecimal("100.00"), null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Currency cannot be null");
    }
    
    @Test
    @DisplayName("Should throw exception when currency is blank")
    void shouldThrowExceptionWhenCurrencyIsBlank() {
        // Act & Assert
        assertThatThrownBy(() -> new Money(new BigDecimal("100.00"), ""))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Currency cannot be null or empty");
    }
    
    // ========== Arithmetic Tests ==========
    
    @Test
    @DisplayName("Should add money with same currency")
    void shouldAddMoneyWithSameCurrency() {
        // Arrange
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("50.00"), "EUR");
        
        // Act
        Money result = money1.add(money2);
        
        // Assert
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(result.currency()).isEqualTo("EUR");
    }
    
    @Test
    @DisplayName("Should throw exception when adding different currencies")
    void shouldThrowExceptionWhenAddingDifferentCurrencies() {
        // Arrange
        Money eur = new Money(new BigDecimal("100.00"), "EUR");
        Money usd = new Money(new BigDecimal("50.00"), "USD");
        
        // Act & Assert
        assertThatThrownBy(() -> eur.add(usd))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Cannot add different currencies")
            .hasMessageContaining("EUR")
            .hasMessageContaining("USD");
    }
    
    @Test
    @DisplayName("Should multiply money by factor")
    void shouldMultiplyMoneyByFactor() {
        // Arrange
        Money money = new Money(new BigDecimal("100.00"), "EUR");
        
        // Act
        Money result = money.multiply(new BigDecimal("2.5"));
        
        // Assert
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(result.currency()).isEqualTo("EUR");
    }
    
    @Test
    @DisplayName("Should throw exception when multiply factor is null")
    void shouldThrowExceptionWhenMultiplyFactorIsNull() {
        // Arrange
        Money money = new Money(new BigDecimal("100.00"), "EUR");
        
        // Act & Assert
        assertThatThrownBy(() -> money.multiply(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Factor cannot be null");
    }
    
    @Test
    @DisplayName("Should multiply by zero")
    void shouldMultiplyByZero() {
        // Arrange
        Money money = new Money(new BigDecimal("100.00"), "EUR");
        
        // Act
        Money result = money.multiply(BigDecimal.ZERO);
        
        // Assert
        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}

package com.singularbank.signature.routing.domain.model.valueobject;

import java.math.BigDecimal;

/**
 * Immutable Value Object representing monetary amount.
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * Money price = new Money(new BigDecimal("100.00"), "EUR");
 * Money total = price.multiply(new BigDecimal("2")); // 200.00 EUR
 * }</pre>
 * 
 * @param amount Monetary amount (must be >= 0)
 * @param currency ISO 4217 currency code (e.g., EUR, USD)
 * @since Story 1.5
 */
public record Money(BigDecimal amount, String currency) {
    
    /**
     * Compact constructor with validation.
     */
    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount must be >= 0, got: " + amount);
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Currency cannot be null or empty");
        }
        // TODO: Validate ISO 4217 currency code (EUR, USD, GBP, etc.)
    }
    
    /**
     * Add another Money amount.
     * 
     * @param other Money to add
     * @return New Money instance with sum
     * @throws IllegalArgumentException if currencies differ
     */
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                String.format("Cannot add different currencies: %s and %s", this.currency, other.currency)
            );
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
    
    /**
     * Multiply amount by factor.
     * 
     * @param factor Multiplication factor
     * @return New Money instance with product
     */
    public Money multiply(BigDecimal factor) {
        if (factor == null) {
            throw new IllegalArgumentException("Factor cannot be null");
        }
        return new Money(this.amount.multiply(factor), this.currency);
    }
}



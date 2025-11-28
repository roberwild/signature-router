package com.bank.signature.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Money Value Object.
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Immutability (Java 21 record)</li>
 *   <li>add() operation (same/different currency)</li>
 *   <li>multiply() operation</li>
 *   <li>Compact constructor validation</li>
 * </ul>
 * 
 * @since Story 1.5
 */
class MoneyTest {

    @Test
    void testAdd_SameCurrency() {
        // Given: Two Money instances with same currency
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("50.50"), "EUR");

        // When: Add money2 to money1
        Money result = money1.add(money2);

        // Then: Result is new Money instance with sum
        assertNotSame(money1, result);
        assertNotSame(money2, result);
        assertEquals(new BigDecimal("150.50"), result.amount());
        assertEquals("EUR", result.currency());

        // Then: Original instances unchanged (immutability)
        assertEquals(new BigDecimal("100.00"), money1.amount());
        assertEquals(new BigDecimal("50.50"), money2.amount());
    }

    @Test
    void testAdd_DifferentCurrency_ThrowsException() {
        // Given: Two Money instances with different currencies
        Money eur = new Money(new BigDecimal("100.00"), "EUR");
        Money usd = new Money(new BigDecimal("50.00"), "USD");

        // When/Then: Attempt to add different currencies throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> eur.add(usd)
        );

        // Then: Exception message contains both currencies
        assertTrue(exception.getMessage().contains("EUR"));
        assertTrue(exception.getMessage().contains("USD"));
        assertTrue(exception.getMessage().contains("different currencies"));
    }

    @Test
    void testMultiply() {
        // Given: Money instance
        Money money = new Money(new BigDecimal("100.00"), "EUR");

        // When: Multiply by factor
        Money result = money.multiply(new BigDecimal("2.5"));

        // Then: Result is new Money instance with product
        assertNotSame(money, result);
        assertEquals(0, new BigDecimal("250.00").compareTo(result.amount()));
        assertEquals("EUR", result.currency());

        // Then: Original instance unchanged (immutability)
        assertEquals(new BigDecimal("100.00"), money.amount());
    }

    @Test
    void testMultiply_ByZero() {
        // Given: Money instance
        Money money = new Money(new BigDecimal("100.00"), "EUR");

        // When: Multiply by zero
        Money result = money.multiply(BigDecimal.ZERO);

        // Then: Result is zero amount
        assertEquals(new BigDecimal("0.00"), result.amount());
        assertEquals("EUR", result.currency());
    }

    @Test
    void testMultiply_NullFactor_ThrowsException() {
        // Given: Money instance
        Money money = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Multiply by null throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> money.multiply(null)
        );

        assertTrue(exception.getMessage().contains("cannot be null"));
    }

    @Test
    void testConstructor_NullAmount_ThrowsException() {
        // When/Then: Create Money with null amount throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Money(null, "EUR")
        );

        assertTrue(exception.getMessage().contains("Amount cannot be null"));
    }

    @Test
    void testConstructor_NegativeAmount_ThrowsException() {
        // When/Then: Create Money with negative amount throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Money(new BigDecimal("-10.00"), "EUR")
        );

        assertTrue(exception.getMessage().contains("must be >= 0"));
        assertTrue(exception.getMessage().contains("-10.00"));
    }

    @Test
    void testConstructor_NullCurrency_ThrowsException() {
        // When/Then: Create Money with null currency throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Money(new BigDecimal("100.00"), null)
        );

        assertTrue(exception.getMessage().contains("Currency cannot be null"));
    }

    @Test
    void testConstructor_EmptyCurrency_ThrowsException() {
        // When/Then: Create Money with empty currency throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Money(new BigDecimal("100.00"), "")
        );

        assertTrue(exception.getMessage().contains("Currency cannot be null or empty"));
    }

    @Test
    void testConstructor_ZeroAmount_Valid() {
        // When: Create Money with zero amount
        Money money = new Money(BigDecimal.ZERO, "EUR");

        // Then: Valid Money instance created
        assertEquals(BigDecimal.ZERO, money.amount());
        assertEquals("EUR", money.currency());
    }

    @Test
    void testImmutability() {
        // Given: Money instance (Java 21 record)
        Money money = new Money(new BigDecimal("100.00"), "EUR");

        // Then: No setters available (compile-time check)
        // Money is a record, so no setters exist
        // All fields are final and immutable
        
        // Then: Accessors return same values
        assertEquals(new BigDecimal("100.00"), money.amount());
        assertEquals("EUR", money.currency());
    }

    @Test
    void testEquals_SameValues() {
        // Given: Two Money instances with same values
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("100.00"), "EUR");

        // Then: Equals by value (record auto-generated equals)
        assertEquals(money1, money2);
        assertEquals(money1.hashCode(), money2.hashCode());
    }

    @Test
    void testEquals_DifferentValues() {
        // Given: Two Money instances with different values
        Money money1 = new Money(new BigDecimal("100.00"), "EUR");
        Money money2 = new Money(new BigDecimal("200.00"), "EUR");
        Money money3 = new Money(new BigDecimal("100.00"), "USD");

        // Then: Not equals
        assertNotEquals(money1, money2);
        assertNotEquals(money1, money3);
    }
}


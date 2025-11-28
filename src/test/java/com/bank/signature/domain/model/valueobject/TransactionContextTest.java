package com.bank.signature.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TransactionContext Value Object.
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Immutability (Java 21 record)</li>
 *   <li>Compact constructor validation (hash format, non-null fields)</li>
 *   <li>SHA256 hash integrity check</li>
 * </ul>
 * 
 * @since Story 1.5
 */
class TransactionContextTest {

    @Test
    void testConstructor_ValidValues() {
        // Given: Valid transaction context data
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String merchantId = "merchant-789";
        String orderId = "order-456";
        String description = "Payment for Order #456";
        String hash = "a".repeat(64); // Valid SHA256 hash

        // When: Create TransactionContext
        TransactionContext context = new TransactionContext(amount, merchantId, orderId, description, hash);

        // Then: Instance created successfully
        assertNotNull(context);
        assertEquals(amount, context.amount());
        assertEquals(merchantId, context.merchantId());
        assertEquals(orderId, context.orderId());
        assertEquals(description, context.description());
        assertEquals(hash, context.hash());
    }

    @Test
    void testImmutability() {
        // Given: TransactionContext instance (Java 21 record)
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        TransactionContext context = new TransactionContext(
            amount,
            "merchant-789",
            "order-456",
            "Payment for Order #456",
            "a".repeat(64)
        );

        // Then: No setters available (compile-time check)
        // TransactionContext is a record, so no setters exist
        // All fields are final and immutable
        
        // Then: Accessors return same values
        assertSame(amount, context.amount());
        assertEquals("merchant-789", context.merchantId());
        assertEquals("order-456", context.orderId());
    }

    @Test
    void testHash_ValidSHA256Format() {
        // Given: Valid SHA256 hash (64 lowercase hex chars)
        String validHash = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When: Create TransactionContext with valid hash
        TransactionContext context = new TransactionContext(
            amount,
            "merchant-789",
            "order-456",
            "Payment",
            validHash
        );

        // Then: Instance created successfully
        assertEquals(validHash, context.hash());
    }

    @Test
    void testHash_InvalidFormat_ThrowsException() {
        // Given: Invalid hash (not 64 chars)
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String invalidHash = "short-hash"; // Too short

        // When/Then: Create TransactionContext with invalid hash throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", "order-456", "Payment", invalidHash)
        );

        assertTrue(exception.getMessage().contains("Hash must be a valid SHA256"));
        assertTrue(exception.getMessage().contains("64 chars"));
    }

    @Test
    void testHash_UppercaseHex_ThrowsException() {
        // Given: Uppercase hex chars (regex requires lowercase)
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String uppercaseHash = "A".repeat(64); // Uppercase, not lowercase

        // When/Then: Create TransactionContext throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", "order-456", "Payment", uppercaseHash)
        );

        assertTrue(exception.getMessage().contains("Hash must be a valid SHA256"));
    }

    @Test
    void testHash_NonHexChars_ThrowsException() {
        // Given: Non-hex chars in hash
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String nonHexHash = "g".repeat(64); // 'g' is not hex (0-9, a-f)

        // When/Then: Create TransactionContext throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", "order-456", "Payment", nonHexHash)
        );

        assertTrue(exception.getMessage().contains("Hash must be a valid SHA256"));
    }

    @Test
    void testHash_Null_ThrowsException() {
        // Given: Null hash
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Create TransactionContext with null hash throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", "order-456", "Payment", null)
        );

        assertTrue(exception.getMessage().contains("Hash must be a valid SHA256"));
    }

    @Test
    void testAmount_Null_ThrowsException() {
        // When/Then: Create TransactionContext with null amount throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(null, "merchant-789", "order-456", "Payment", "a".repeat(64))
        );

        assertTrue(exception.getMessage().contains("Amount cannot be null"));
    }

    @Test
    void testMerchantId_Null_ThrowsException() {
        // Given: Null merchantId
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Create TransactionContext with null merchantId throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, null, "order-456", "Payment", "a".repeat(64))
        );

        assertTrue(exception.getMessage().contains("MerchantId cannot be null"));
    }

    @Test
    void testMerchantId_Empty_ThrowsException() {
        // Given: Empty merchantId
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Create TransactionContext with empty merchantId throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "", "order-456", "Payment", "a".repeat(64))
        );

        assertTrue(exception.getMessage().contains("MerchantId cannot be null or empty"));
    }

    @Test
    void testOrderId_Null_ThrowsException() {
        // Given: Null orderId
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Create TransactionContext with null orderId throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", null, "Payment", "a".repeat(64))
        );

        assertTrue(exception.getMessage().contains("OrderId cannot be null"));
    }

    @Test
    void testDescription_Null_ThrowsException() {
        // Given: Null description
        Money amount = new Money(new BigDecimal("100.00"), "EUR");

        // When/Then: Create TransactionContext with null description throws exception
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new TransactionContext(amount, "merchant-789", "order-456", null, "a".repeat(64))
        );

        assertTrue(exception.getMessage().contains("Description cannot be null"));
    }

    @Test
    void testEquals_SameValues() {
        // Given: Two TransactionContext instances with same values
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        TransactionContext context1 = new TransactionContext(amount, "merchant-789", "order-456", "Payment", "a".repeat(64));
        TransactionContext context2 = new TransactionContext(amount, "merchant-789", "order-456", "Payment", "a".repeat(64));

        // Then: Equals by value (record auto-generated equals)
        assertEquals(context1, context2);
        assertEquals(context1.hashCode(), context2.hashCode());
    }
}


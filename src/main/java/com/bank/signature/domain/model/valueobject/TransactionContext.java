package com.bank.signature.domain.model.valueobject;

/**
 * Immutable Value Object representing transaction context for signature request.
 * 
 * <p><b>Security:</b> Hash (SHA256) ensures transaction context integrity (non-repudiation).</p>
 * 
 * @param amount Transaction monetary amount
 * @param merchantId Merchant identifier (pseudonymized)
 * @param orderId Order/transaction identifier
 * @param description Human-readable transaction description
 * @param hash SHA256 hash of transaction data (integrity check)
 * @since Story 1.5
 */
public record TransactionContext(
    Money amount,
    String merchantId,
    String orderId,
    String description,
    String hash
) {
    
    /**
     * Compact constructor with validation.
     */
    public TransactionContext {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (merchantId == null || merchantId.isBlank()) {
            throw new IllegalArgumentException("MerchantId cannot be null or empty");
        }
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("OrderId cannot be null or empty");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description cannot be null or empty");
        }
        if (hash == null || !hash.matches("^[a-f0-9]{64}$")) {
            throw new IllegalArgumentException("Hash must be a valid SHA256 hex string (64 chars)");
        }
    }
}







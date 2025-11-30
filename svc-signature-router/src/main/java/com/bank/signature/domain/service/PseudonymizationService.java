package com.bank.signature.domain.service;

/**
 * Domain service for pseudonymizing sensitive data (customer IDs).
 * Story 2.1: Create Signature Request Use Case
 * 
 * Uses HMAC-SHA256 with a secret key for one-way pseudonymization.
 * This ensures PII compliance (GDPR, PCI-DSS) while maintaining
 * the ability to query by customer ID.
 * 
 * Implementation: Infrastructure layer provides the secret key via Vault.
 */
public interface PseudonymizationService {
    
    /**
     * Pseudonymizes a customer ID using HMAC-SHA256.
     * 
     * The same input always produces the same output (deterministic),
     * but the original value cannot be recovered (one-way).
     * 
     * @param customerId The original customer ID
     * @return The pseudonymized customer ID (hex-encoded)
     */
    String pseudonymize(String customerId);
    
    /**
     * Verifies if a plaintext customer ID matches a pseudonymized value.
     * 
     * @param customerId The plaintext customer ID
     * @param pseudonymizedValue The pseudonymized value to verify
     * @return true if they match, false otherwise
     */
    boolean verify(String customerId, String pseudonymizedValue);
}


package com.bank.signature.domain.service;

import com.bank.signature.domain.model.valueobject.TransactionContext;

/**
 * Domain service for calculating cryptographic hashes of transaction contexts.
 * Story 2.1: Create Signature Request Use Case
 * 
 * Uses SHA-256 for immutable transaction context integrity verification.
 * The hash allows detecting any tampering with transaction details.
 */
public interface TransactionHashService {
    
    /**
     * Calculates SHA-256 hash of a transaction context.
     * 
     * The hash is calculated over a canonical JSON representation
     * to ensure consistent hashing regardless of field ordering.
     * 
     * @param transactionContext The transaction context to hash
     * @return The SHA-256 hash (hex-encoded, 64 characters)
     */
    String calculateHash(TransactionContext transactionContext);
    
    /**
     * Verifies if a transaction context matches a given hash.
     * 
     * @param transactionContext The transaction context to verify
     * @param expectedHash The expected hash value
     * @return true if the hash matches, false otherwise
     */
    boolean verifyHash(TransactionContext transactionContext, String expectedHash);
}


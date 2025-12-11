package com.singularbank.signature.routing.domain.port.outbound;

/**
 * Port for pseudonymizing sensitive customer data (GDPR Art. 4(5)).
 * Story 8.3: Pseudonymization Service
 * 
 * <p><b>Purpose:</b> Protect Personal Identifiable Information (PII) by converting
 * customer IDs into irreversible pseudonymized hashes using HMAC-SHA256.</p>
 * 
 * <p><b>GDPR Compliance:</b></p>
 * <ul>
 *   <li>Art. 4(5): Pseudonymisation definition</li>
 *   <li>Art. 25: Data protection by design and by default</li>
 *   <li>Art. 32: Security of processing (technical measures)</li>
 * </ul>
 * 
 * <p><b>Implementation:</b> HMAC-SHA256 with secret key from Vault</p>
 * <ul>
 *   <li>Deterministic: Same input → Same output (for lookups)</li>
 *   <li>Irreversible: Cannot recover original customer ID</li>
 *   <li>Collision-resistant: SHA-256 provides 128-bit security</li>
 * </ul>
 * 
 * <p><b>Use Cases:</b></p>
 * <ul>
 *   <li>Store pseudonymized customer ID in database (NEVER store original)</li>
 *   <li>Log pseudonymized ID (compliance with data minimization)</li>
 *   <li>Verify customer ownership without exposing PII</li>
 * </ul>
 * 
 * @since Story 8.3
 */
public interface PseudonymizationService {
    
    /**
     * Pseudonymizes a customer ID using HMAC-SHA256.
     * 
     * <p>Converts a clear-text customer ID into a 64-character hex string (256 bits).</p>
     * 
     * <p><b>Properties:</b></p>
     * <ul>
     *   <li><b>Deterministic:</b> pseudonymize("CUST123") always returns the same hash</li>
     *   <li><b>Irreversible:</b> Cannot recover "CUST123" from the hash</li>
     *   <li><b>Collision-resistant:</b> Different IDs → Different hashes (with overwhelming probability)</li>
     * </ul>
     * 
     * <p><b>Example:</b></p>
     * <pre>
     * String customerId = "CUST_987654321";
     * String pseudonymized = pseudonymizationService.pseudonymize(customerId);
     * // pseudonymized = "a3f5e9... (64 hex chars)"
     * </pre>
     * 
     * @param customerId The clear-text customer ID to pseudonymize (e.g., "CUST_123456")
     * @return A 64-character hex string representing the HMAC-SHA256 hash
     * @throws com.singularbank.signature.routing.domain.exception.PseudonymizationException if hashing fails
     * @throws IllegalArgumentException if customerId is null or blank
     */
    String pseudonymize(String customerId);
    
    /**
     * Verifies if a pseudonymized ID matches the original customer ID.
     * 
     * <p>This method pseudonymizes the customer ID and compares it with the provided
     * pseudonymized ID, enabling verification without storing the original ID.</p>
     * 
     * <p><b>Use Case:</b> Verify if a user has permission to access a signature request
     * without storing or exposing their original customer ID.</p>
     * 
     * <p><b>Example:</b></p>
     * <pre>
     * String originalCustomerId = "CUST_123456";
     * String storedPseudonymizedId = signatureRequest.getCustomerId(); // from DB
     * 
     * boolean isOwner = pseudonymizationService.verify(originalCustomerId, storedPseudonymizedId);
     * // isOwner = true if the signature request belongs to CUST_123456
     * </pre>
     * 
     * @param customerId The original customer ID to verify
     * @param pseudonymizedId The pseudonymized ID to compare against (64 hex chars)
     * @return {@code true} if the pseudonymized form of customerId matches pseudonymizedId
     * @throws com.singularbank.signature.routing.domain.exception.PseudonymizationException if hashing fails
     * @throws IllegalArgumentException if either parameter is null or blank
     */
    boolean verify(String customerId, String pseudonymizedId);
}


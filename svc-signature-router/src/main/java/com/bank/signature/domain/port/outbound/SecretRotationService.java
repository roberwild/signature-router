package com.bank.signature.domain.port.outbound;

/**
 * Port for managing secret rotation in HashiCorp Vault.
 * Story 8.5: Vault Secret Rotation
 * 
 * <p><b>Purpose:</b> Automate rotation of sensitive secrets (keys, credentials)
 * to minimize risk of compromise.</p>
 * 
 * <p><b>Rotation Strategy:</b></p>
 * <ul>
 *   <li><b>Pseudonymization Key:</b> Manual rotation with 7-day grace period</li>
 *   <li><b>Database Credentials:</b> Vault dynamic secrets (90-day TTL)</li>
 *   <li><b>API Keys:</b> Vault KV v2 versioned secrets</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC6.1: Implement logical access security</li>
 *   <li>PCI-DSS Req 8.3.9: Change user passwords at least every 90 days</li>
 * </ul>
 * 
 * @since Story 8.5
 */
public interface SecretRotationService {
    
    /**
     * Rotates the pseudonymization HMAC key in Vault.
     * 
     * <p><b>Rotation Process:</b></p>
     * <ol>
     *   <li>Generate new 256-bit HMAC key</li>
     *   <li>Store new key as version N+1 in Vault</li>
     *   <li>Keep old key (version N) active for grace period (7 days)</li>
     *   <li>Update cache to prefer new key for pseudonymization</li>
     *   <li>Log rotation event to audit log</li>
     * </ol>
     * 
     * <p><b>Grace Period:</b> Old key remains valid for 7 days to allow
     * for gradual migration and to avoid breaking existing pseudonymized data.</p>
     * 
     * @return The new key version number
     * @throws com.bank.signature.domain.exception.SecretRotationException if rotation fails
     */
    int rotatePseudonymizationKey();
    
    /**
     * Gets the current active version of the pseudonymization key.
     * 
     * @return The current key version (1, 2, 3, ...)
     */
    int getCurrentKeyVersion();
    
    /**
     * Checks if a key rotation is due based on the rotation policy.
     * 
     * <p><b>Rotation Policy:</b> Keys should be rotated every 90 days.</p>
     * 
     * @return true if rotation is due, false otherwise
     */
    boolean isRotationDue();
}


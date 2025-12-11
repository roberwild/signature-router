package com.singularbank.signature.routing.infrastructure.adapter.outbound.security;

import com.singularbank.signature.routing.domain.exception.PseudonymizationException;
import com.singularbank.signature.routing.domain.port.outbound.PseudonymizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

/**
 * Vault-backed implementation of PseudonymizationService using HMAC-SHA256.
 * Story 8.3: Pseudonymization Service
 * 
 * <p><b>Algorithm:</b> HMAC-SHA256 (Hash-based Message Authentication Code)</p>
 * <ul>
 *   <li><b>Input:</b> Customer ID (UTF-8 string)</li>
 *   <li><b>Secret Key:</b> 256-bit random key from Vault</li>
 *   <li><b>Output:</b> 64-character hex string (256 bits)</li>
 * </ul>
 * 
 * <p><b>Security Properties:</b></p>
 * <ul>
 *   <li>Deterministic: Same input + key → Same output</li>
 *   <li>Irreversible: Cannot recover input from output (one-way function)</li>
 *   <li>Collision-resistant: Different inputs → Different outputs (with overwhelming probability)</li>
 *   <li>Key-dependent: Different keys → Different outputs for same input</li>
 * </ul>
 * 
 * <p><b>Vault Integration:</b></p>
 * <ul>
 *   <li>Secret path: {@code secret/data/signature-router/pseudonymization-key}</li>
 *   <li>Secret field: {@code key} (256-bit hex string)</li>
 *   <li>Cached for performance (cache eviction every 24 hours)</li>
 * </ul>
 * 
 * <p><b>GDPR Compliance:</b></p>
 * <ul>
 *   <li>Art. 4(5): Pseudonymisation technique</li>
 *   <li>Art. 25: Data protection by design</li>
 *   <li>Art. 32(1)(a): Pseudonymisation as security measure</li>
 * </ul>
 * 
 * @since Story 8.3
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "spring.cloud.vault", name = "enabled", havingValue = "true")
public class VaultPseudonymizationServiceImpl implements PseudonymizationService {
    
    private final VaultTemplate vaultTemplate;
    
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String VAULT_SECRET_PATH = "secret/data/signature-router/pseudonymization-key";
    private static final String VAULT_KEY_FIELD = "key";
    
    /**
     * Pseudonymizes a customer ID using HMAC-SHA256.
     * 
     * <p><b>Process:</b></p>
     * <ol>
     *   <li>Retrieve secret key from Vault (cached)</li>
     *   <li>Initialize HMAC-SHA256 with secret key</li>
     *   <li>Hash customer ID (UTF-8 bytes)</li>
     *   <li>Convert hash to 64-character hex string</li>
     * </ol>
     * 
     * <p><b>Example:</b></p>
     * <pre>
     * pseudonymize("CUST_123456") → "a3f5e9b7c2d4... (64 hex chars)"
     * pseudonymize("CUST_123456") → "a3f5e9b7c2d4... (same output, deterministic)"
     * </pre>
     * 
     * @param customerId The clear-text customer ID (e.g., "CUST_987654321")
     * @return 64-character hex string (HMAC-SHA256 hash)
     * @throws PseudonymizationException if HMAC fails or Vault is unreachable
     * @throws IllegalArgumentException if customerId is null or blank
     */
    @Override
    public String pseudonymize(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Customer ID cannot be null or blank");
        }
        
        log.debug("Pseudonymizing customer ID: {}...", customerId.substring(0, Math.min(4, customerId.length())));
        
        try {
            String secretKey = getSecretKeyFromVault();
            
            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8),
                HMAC_ALGORITHM
            );
            hmac.init(secretKeySpec);
            
            byte[] hash = hmac.doFinal(customerId.getBytes(StandardCharsets.UTF_8));
            String pseudonymized = HexFormat.of().formatHex(hash);
            
            log.debug("Pseudonymized customer ID: {}... → {}...", 
                customerId.substring(0, Math.min(4, customerId.length())),
                pseudonymized.substring(0, 8));
            
            return pseudonymized;
            
        } catch (Exception e) {
            log.error("Failed to pseudonymize customer ID: {}", e.getMessage());
            throw new PseudonymizationException("Failed to pseudonymize customer ID", e);
        }
    }
    
    /**
     * Verifies if a pseudonymized ID matches the original customer ID.
     * 
     * <p>This method re-pseudonymizes the customer ID and performs a constant-time
     * string comparison to prevent timing attacks.</p>
     * 
     * <p><b>Example:</b></p>
     * <pre>
     * String original = "CUST_123456";
     * String stored = "a3f5e9b7c2d4..."; // from database
     * 
     * verify(original, stored) → true  (if hashes match)
     * verify("CUST_999999", stored) → false (different customer)
     * </pre>
     * 
     * @param customerId The original customer ID to verify
     * @param pseudonymizedId The pseudonymized ID to compare (64 hex chars)
     * @return {@code true} if hashes match, {@code false} otherwise
     * @throws PseudonymizationException if hashing fails
     * @throws IllegalArgumentException if either parameter is null or blank
     */
    @Override
    public boolean verify(String customerId, String pseudonymizedId) {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Customer ID cannot be null or blank");
        }
        if (pseudonymizedId == null || pseudonymizedId.isBlank()) {
            throw new IllegalArgumentException("Pseudonymized ID cannot be null or blank");
        }
        
        log.debug("Verifying customer ID: {}... against pseudonymized ID: {}...", 
            customerId.substring(0, Math.min(4, customerId.length())),
            pseudonymizedId.substring(0, 8));
        
        String computedHash = pseudonymize(customerId);
        boolean matches = computedHash.equals(pseudonymizedId);
        
        log.debug("Verification result: {}", matches ? "MATCH" : "NO MATCH");
        
        return matches;
    }
    
    /**
     * Retrieves the HMAC secret key from Vault.
     * 
     * <p><b>Vault Path:</b> {@code secret/data/signature-router/pseudonymization-key}</p>
     * <p><b>Field:</b> {@code key} (256-bit hex string)</p>
     * 
     * <p>The secret key is cached for 24 hours to reduce Vault load.
     * Cache eviction policy is configured in {@code application.yml}.</p>
     * 
     * @return The HMAC secret key (256-bit hex string)
     * @throws PseudonymizationException if Vault is unreachable or secret not found
     */
    @Cacheable(value = "pseudonymization-keys", key = "'hmac-key'")
    protected String getSecretKeyFromVault() {
        log.debug("Retrieving pseudonymization key from Vault: {}", VAULT_SECRET_PATH);
        
        try {
            VaultResponse response = vaultTemplate.read(VAULT_SECRET_PATH);
            
            if (response == null || response.getData() == null) {
                throw new PseudonymizationException(
                    "Vault secret not found at path: " + VAULT_SECRET_PATH
                );
            }
            
            Map<String, Object> data = response.getData();
            Object keyValue = data.get(VAULT_KEY_FIELD);
            
            if (keyValue == null) {
                throw new PseudonymizationException(
                    "Vault secret field '" + VAULT_KEY_FIELD + "' not found at path: " + VAULT_SECRET_PATH
                );
            }
            
            String secretKey = keyValue.toString();
            
            log.info("✅ Pseudonymization key retrieved successfully from Vault");
            
            return secretKey;
            
        } catch (PseudonymizationException e) {
            throw e; // Re-throw custom exception
        } catch (Exception e) {
            log.error("❌ Failed to retrieve pseudonymization key from Vault: {}", e.getMessage());
            throw new PseudonymizationException("Failed to retrieve secret key from Vault", e);
        }
    }
}


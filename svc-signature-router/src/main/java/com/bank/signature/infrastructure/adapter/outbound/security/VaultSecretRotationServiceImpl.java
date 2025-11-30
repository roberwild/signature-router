package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.exception.SecretRotationException;
import com.bank.signature.domain.model.event.AuditEvent;
import com.bank.signature.domain.model.valueobject.AuditAction;
import com.bank.signature.domain.model.valueobject.AuditEventType;
import com.bank.signature.domain.port.outbound.AuditService;
import com.bank.signature.domain.port.outbound.SecretRotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.stereotype.Service;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Vault-based secret rotation service implementation.
 * Story 8.5: Vault Secret Rotation
 * 
 * <p><b>Rotation Strategy:</b></p>
 * <ul>
 *   <li>Pseudonymization key rotation every 90 days</li>
 *   <li>Database credentials rotation every 1 hour (managed by Vault)</li>
 *   <li>Grace period of 7 days for old keys</li>
 *   <li>Automatic cache eviction after rotation</li>
 *   <li>Audit logging of all rotation events</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>PCI-DSS Req 8.3.9: Change user passwords every 90 days</li>
 *   <li>SOC 2 CC6.1: Logical access security</li>
 * </ul>
 * 
 * @since Story 8.5
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "spring.cloud.vault", name = "enabled", havingValue = "true")
public class VaultSecretRotationServiceImpl implements SecretRotationService {
    
    private static final String PSEUDO_KEY_PATH = "secret/signature-router/pseudonymization-key";
    private static final String PSEUDO_KEY_FIELD = "key";
    private static final int ROTATION_PERIOD_DAYS = 90;
    private static final int GRACE_PERIOD_DAYS = 7;
    
    private final VaultTemplate vaultTemplate;
    private final AuditService auditService;
    private final CacheManager cacheManager;
    private final ContextRefresher contextRefresher;
    
    @Override
    public int rotatePseudonymizationKey() {
        log.info("🔄 Starting pseudonymization key rotation...");
        
        try {
            // 1. Read current key metadata
            VaultResponse currentResponse = vaultTemplate.read(PSEUDO_KEY_PATH);
            String oldKey = extractKeyFromResponse(currentResponse);
            int currentVersion = getCurrentKeyVersion();
            int newVersion = currentVersion + 1;
            
            // 2. Generate new key
            String newKey = generateNewKey();
            
            // 3. Write new key to Vault with metadata
            Map<String, Object> newKeyData = Map.of(
                PSEUDO_KEY_FIELD, newKey,
                "version", newVersion,
                "created_at", Instant.now().toString(),
                "rotation_period", ROTATION_PERIOD_DAYS + "d",
                "grace_period", GRACE_PERIOD_DAYS + "d",
                "algorithm", "HMAC-SHA256",
                "rotated_by", "VaultSecretRotationService",
                "previous_key_hash", hashKey(oldKey) // Store hash of old key for verification
            );
            
            vaultTemplate.write(PSEUDO_KEY_PATH, newKeyData);
            
            log.info("✅ New pseudonymization key version {} written to Vault", newVersion);
            
            // 4. Evict cache to force reload
            evictPseudonymizationCache();
            
            // 5. Refresh Spring Cloud Config context
            contextRefresher.refresh();
            
            log.info("✅ Cache evicted and context refreshed");
            
            // 6. Audit log the rotation
            auditService.log(new AuditEvent(
                AuditEventType.SECRET_ROTATED,
                "PSEUDONYMIZATION_KEY",
                null, // entityId - not applicable for system-wide secrets
                AuditAction.UPDATE,
                "SYSTEM",
                "SYSTEM",
                Map.of(
                    "vault_path", PSEUDO_KEY_PATH,
                    "old_version", currentVersion,
                    "new_version", newVersion,
                    "rotation_period_days", ROTATION_PERIOD_DAYS,
                    "grace_period_days", GRACE_PERIOD_DAYS,
                    "old_key_hash", hashKey(oldKey),
                    "new_key_hash", hashKey(newKey)
                ),
                "127.0.0.1",
                "VaultSecretRotationService",
                "rotation-" + Instant.now().toEpochMilli()
            ));
            
            log.info("🎉 Pseudonymization key rotation completed successfully");
            
            return newVersion;
            
        } catch (Exception e) {
            log.error("❌ Failed to rotate pseudonymization key: {}", e.getMessage(), e);
            
            // Audit log the failure
            auditService.log(new AuditEvent(
                AuditEventType.SECRET_ROTATION_FAILED,
                "PSEUDONYMIZATION_KEY",
                null, // entityId - not applicable for system-wide secrets
                AuditAction.UPDATE,
                "SYSTEM",
                "SYSTEM",
                Map.of("vault_path", PSEUDO_KEY_PATH, "error", e.getMessage()),
                "127.0.0.1",
                "VaultSecretRotationService",
                "rotation-failed-" + Instant.now().toEpochMilli()
            ));
            
            throw new SecretRotationException("Failed to rotate pseudonymization key", e);
        }
    }
    
    @Override
    public int getCurrentKeyVersion() {
        try {
            VaultResponse response = vaultTemplate.read(PSEUDO_KEY_PATH);
            if (response != null && response.getData() != null) {
                Object version = response.getData().get("version");
                if (version != null) {
                    return Integer.parseInt(version.toString());
                }
            }
            return 1; // Default version if not found
        } catch (Exception e) {
            log.warn("Failed to get current key version: {}", e.getMessage());
            return 1;
        }
    }
    
    @Override
    public boolean isRotationDue() {
        try {
            VaultResponse response = vaultTemplate.read(PSEUDO_KEY_PATH);
            if (response == null || response.getData() == null) {
                return true; // No key found, rotation needed
            }
            
            Object createdAtObj = response.getData().get("created_at");
            if (createdAtObj == null) {
                return true; // No creation date, rotation needed
            }
            
            Instant createdAt = Instant.parse(createdAtObj.toString());
            Instant rotationThreshold = Instant.now().minus(ROTATION_PERIOD_DAYS, java.time.temporal.ChronoUnit.DAYS);
            
            boolean isDue = createdAt.isBefore(rotationThreshold);
            log.info("Rotation due check: created_at={}, threshold={}, is_due={}", createdAt, rotationThreshold, isDue);
            
            return isDue;
        } catch (Exception e) {
            log.error("Failed to check if rotation is due: {}", e.getMessage(), e);
            return false;
        }
    }
    
    // Note: rotateDatabaseCredentials() and verifyRotation() methods removed
    // They are not part of the SecretRotationService interface
    
    /**
     * Verifies rotation (internal method, not part of interface).
     */
    public boolean verifyRotation() {
        log.info("🔍 Verifying secret rotation...");
        
        try {
            // 1. Verify pseudonymization key exists and is valid
            VaultResponse response = vaultTemplate.read(PSEUDO_KEY_PATH);
            if (response == null || response.getData() == null) {
                log.error("❌ Pseudonymization key not found in Vault");
                return false;
            }
            
            String key = extractKeyFromResponse(response);
            if (key == null || key.isEmpty()) {
                log.error("❌ Pseudonymization key is empty");
                return false;
            }
            
            // 2. Verify key metadata
            Map<String, Object> data = response.getData();
            if (!data.containsKey("created_at") || !data.containsKey("rotation_period")) {
                log.warn("⚠️ Pseudonymization key metadata incomplete");
            }
            
            log.info("✅ Secret rotation verification passed");
            return true;
            
        } catch (Exception e) {
            log.error("❌ Secret rotation verification failed: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Generates a new cryptographically secure random key.
     * 
     * @return 64-character hex string (256 bits)
     */
    private String generateNewKey() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        byte[] bytes = new byte[32]; // 256 bits
        random.nextBytes(bytes);
        return bytesToHex(bytes);
    }
    
    /**
     * Converts byte array to hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
    
    /**
     * Creates a SHA-256 hash of the key for audit purposes.
     */
    private String hashKey(String key) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            log.error("Failed to hash key: {}", e.getMessage());
            return "HASH_ERROR";
        }
    }
    
    /**
     * Extracts the key value from Vault response.
     */
    private String extractKeyFromResponse(VaultResponse response) {
        if (response == null || response.getData() == null) {
            throw new SecretRotationException("Vault response is null or empty");
        }
        
        Object keyValue = response.getData().get(PSEUDO_KEY_FIELD);
        if (keyValue == null) {
            throw new SecretRotationException("Key field not found in Vault response");
        }
        
        return keyValue.toString();
    }
    
    /**
     * Evicts the pseudonymization key from cache.
     */
    private void evictPseudonymizationCache() {
        try {
            var cache = cacheManager.getCache("pseudonymization-keys");
            if (cache != null) {
                cache.evict("hmac-key");
                log.info("✅ Pseudonymization cache evicted");
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to evict cache: {}", e.getMessage());
        }
    }
}


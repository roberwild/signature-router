package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.port.outbound.PseudonymizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * No-Op implementation of PseudonymizationService for local development.
 * 
 * <p>This implementation is used when Vault is disabled (e.g., in local development).</p>
 * 
 * <p><b>Security Warning:</b> This implementation does NOT provide real pseudonymization.
 * It simply returns a hash of the input for development/testing purposes only.</p>
 * 
 * <p><b>Production:</b> Use VaultPseudonymizationServiceImpl with proper Vault configuration.</p>
 * 
 * @since Story 8.3 (Pseudonymization)
 */
@Service
@Slf4j
@ConditionalOnProperty(prefix = "security.pseudonymization", name = "noop", havingValue = "true")
public class NoOpPseudonymizationService implements PseudonymizationService {
    
    public NoOpPseudonymizationService() {
        log.warn("⚠️  Using NoOpPseudonymizationService - NOT suitable for production!");
        log.warn("⚠️  Enable Vault (vault.enabled=true) for real pseudonymization");
    }
    
    /**
     * Simple hash-based pseudonymization for development.
     * 
     * <p><b>WARNING:</b> This is NOT cryptographically secure!</p>
     * 
     * @param plaintext The plaintext customer ID
     * @return A simple hash of the input (for development only)
     */
    @Override
    public String pseudonymize(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new IllegalArgumentException("Plaintext cannot be null or blank");
        }
        
        // Simple hash for development (NOT secure for production)
        int hash = plaintext.hashCode();
        String pseudonym = "PSEUDO_" + Integer.toHexString(hash).toUpperCase();
        
        log.debug("NoOp pseudonymization: {} -> {}", plaintext, pseudonym);
        return pseudonym;
    }
    
    /**
     * Verifies if a pseudonymized ID matches the original customer ID.
     * 
     * @param customerId The original customer ID
     * @param pseudonymizedId The pseudonymized ID to compare against
     * @return true if they match
     */
    @Override
    public boolean verify(String customerId, String pseudonymizedId) {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Customer ID cannot be null or blank");
        }
        if (pseudonymizedId == null || pseudonymizedId.isBlank()) {
            throw new IllegalArgumentException("Pseudonymized ID cannot be null or blank");
        }
        
        String computed = pseudonymize(customerId);
        boolean matches = computed.equals(pseudonymizedId);
        
        log.debug("NoOp verify: {} -> {} == {} ? {}", customerId, computed, pseudonymizedId, matches);
        return matches;
    }
}


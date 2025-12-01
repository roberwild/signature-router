package com.bank.signature.domain.port.outbound;

import java.util.Map;
import java.util.Optional;

/**
 * Vault Credentials Port (Outbound)
 * Story 13.5: Vault Integration for Credentials
 * Epic 13: Providers CRUD Management
 * 
 * Port for interacting with HashiCorp Vault to store/retrieve provider credentials.
 * 
 * Security:
 * - Credentials NEVER stored in database
 * - Credentials stored only in Vault
 * - Credentials encrypted at rest in Vault
 * - Access controlled via Vault policies
 */
public interface VaultCredentialsPort {
    
    /**
     * Store credentials in Vault
     * 
     * @param path Vault path (e.g., "secret/signature-router/providers/twilio-sms")
     * @param credentials Map of credential key-value pairs
     * @throws VaultException if storage fails
     */
    void storeCredentials(String path, Map<String, Object> credentials);
    
    /**
     * Retrieve credentials from Vault
     * 
     * @param path Vault path
     * @return Optional map of credentials (empty if not found)
     * @throws VaultException if retrieval fails
     */
    Optional<Map<String, Object>> retrieveCredentials(String path);
    
    /**
     * Delete credentials from Vault
     * 
     * @param path Vault path
     * @throws VaultException if deletion fails
     */
    void deleteCredentials(String path);
    
    /**
     * Check if credentials exist at path
     * 
     * @param path Vault path
     * @return true if credentials exist
     */
    boolean credentialsExist(String path);
}


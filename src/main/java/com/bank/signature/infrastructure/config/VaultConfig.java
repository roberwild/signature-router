package com.bank.signature.infrastructure.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;

import java.util.Map;

/**
 * Vault configuration for programmatic secret access.
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * @Autowired
 * private VaultConfig vaultConfig;
 * 
 * String twilioApiKey = vaultConfig.getSecret("twilio.api-key");
 * }</pre>
 * 
 * <p><b>Secret Injection via @Value:</b></p>
 * <pre>{@code
 * @Value("${database.password}")
 * private String dbPassword;  // Loaded from Vault secret/signature-router/database.password
 * }</pre>
 * 
 * <p><b>Dynamic Secret Refresh:</b></p>
 * <pre>{@code
 * @Component
 * @RefreshScope
 * public class MyService {
 *     @Value("${twilio.api-key}")
 *     private String twilioKey;  // Refreshes every 60s if changed in Vault
 * }
 * }</pre>
 * 
 * @see VaultTemplate
 * @since Story 1.4
 */
@Configuration
public class VaultConfig {

    @Autowired
    private VaultTemplate vaultTemplate;

    /**
     * Read a secret from Vault KV store.
     * 
     * @param key Secret key (e.g., "twilio.api-key")
     * @return Secret value as String
     */
    public String getSecret(String key) {
        VaultResponse response = vaultTemplate.read("secret/data/signature-router");
        if (response == null || response.getData() == null) {
            throw new IllegalStateException("Vault secret not found: secret/signature-router");
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData().get("data");
        
        return (String) data.get(key);
    }

    /**
     * Write a secret to Vault KV store.
     * 
     * @param key Secret key
     * @param value Secret value
     */
    public void writeSecret(String key, String value) {
        Map<String, Object> data = Map.of("data", Map.of(key, value));
        vaultTemplate.write("secret/data/signature-router", data);
    }

    /**
     * Write multiple secrets to Vault KV store.
     * 
     * @param secrets Map of secret key-value pairs
     */
    public void writeSecrets(Map<String, Object> secrets) {
        Map<String, Object> data = Map.of("data", secrets);
        vaultTemplate.write("secret/data/signature-router", data);
    }
}


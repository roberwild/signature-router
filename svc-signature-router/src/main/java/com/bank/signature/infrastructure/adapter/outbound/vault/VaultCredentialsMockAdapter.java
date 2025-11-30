package com.bank.signature.infrastructure.adapter.outbound.vault;

import com.bank.signature.domain.port.outbound.VaultCredentialsPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Vault Credentials Mock Adapter (In-Memory Implementation)
 * Story 13.5: Vault Integration for Credentials
 * Epic 13: Providers CRUD Management
 * 
 * Mock implementation using in-memory storage for development/testing.
 * 
 * Enabled when: vault.enabled=false (default for dev)
 * 
 * WARNING: This is NOT secure. Use only for development/testing.
 * Production MUST use real Vault.
 */
@Component
@ConditionalOnProperty(name = "vault.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class VaultCredentialsMockAdapter implements VaultCredentialsPort {
    
    private final Map<String, Map<String, Object>> inMemoryStore = new ConcurrentHashMap<>();
    
    public VaultCredentialsMockAdapter() {
        log.warn("=".repeat(80));
        log.warn("USING MOCK VAULT ADAPTER - NOT SUITABLE FOR PRODUCTION");
        log.warn("Set vault.enabled=true to use real HashiCorp Vault");
        log.warn("=".repeat(80));
        
        // Seed with dev credentials
        seedDevCredentials();
    }
    
    @Override
    public void storeCredentials(String path, Map<String, Object> credentials) {
        log.info("Mock Vault: Storing credentials at path={}", path);
        inMemoryStore.put(path, Map.copyOf(credentials));
    }
    
    @Override
    public Optional<Map<String, Object>> retrieveCredentials(String path) {
        log.debug("Mock Vault: Retrieving credentials from path={}", path);
        return Optional.ofNullable(inMemoryStore.get(path));
    }
    
    @Override
    public void deleteCredentials(String path) {
        log.info("Mock Vault: Deleting credentials at path={}", path);
        inMemoryStore.remove(path);
    }
    
    @Override
    public boolean credentialsExist(String path) {
        boolean exists = inMemoryStore.containsKey(path);
        log.debug("Mock Vault: Credentials exist check: path={}, exists={}", path, exists);
        return exists;
    }
    
    /**
     * Seed mock credentials for development providers
     */
    private void seedDevCredentials() {
        log.info("Seeding mock Vault with dev credentials");
        
        // Twilio SMS Dev
        inMemoryStore.put("secret/signature-router/providers/twilio-sms-dev", Map.of(
            "account_sid", "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            "auth_token", "mock-auth-token-twilio-sms-dev",
            "from_number", "+1234567890"
        ));
        
        // FCM Push Dev
        inMemoryStore.put("secret/signature-router/providers/fcm-push-dev", Map.of(
            "server_key", "mock-fcm-server-key-dev",
            "sender_id", "123456789012"
        ));
        
        // Twilio Voice Dev
        inMemoryStore.put("secret/signature-router/providers/twilio-voice-dev", Map.of(
            "account_sid", "ACyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
            "auth_token", "mock-auth-token-twilio-voice-dev",
            "from_number", "+0987654321"
        ));
        
        // Biometric Stub Dev
        inMemoryStore.put("secret/signature-router/providers/biometric-stub-dev", Map.of(
            "api_key", "mock-biometric-api-key-dev"
        ));
        
        log.info("Mock Vault seeded with {} credential sets", inMemoryStore.size());
    }
}


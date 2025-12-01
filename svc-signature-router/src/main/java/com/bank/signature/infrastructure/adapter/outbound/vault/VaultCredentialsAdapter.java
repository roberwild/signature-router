package com.bank.signature.infrastructure.adapter.outbound.vault;

import com.bank.signature.domain.exception.VaultException;
import com.bank.signature.domain.port.outbound.VaultCredentialsPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;
import org.springframework.vault.support.VaultResponseSupport;

import java.util.Map;
import java.util.Optional;

/**
 * Vault Credentials Adapter (HashiCorp Vault Implementation)
 * Story 13.5: Vault Integration for Credentials
 * Epic 13: Providers CRUD Management
 * 
 * Real implementation using Spring Vault to interact with HashiCorp Vault.
 * 
 * Enabled when: vault.enabled=true
 */
@Component
@ConditionalOnProperty(name = "vault.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class VaultCredentialsAdapter implements VaultCredentialsPort {
    
    private final VaultTemplate vaultTemplate;
    
    @Override
    public void storeCredentials(String path, Map<String, Object> credentials) {
        log.info("Storing credentials in Vault: path={}", path);
        
        try {
            vaultTemplate.write(path, credentials);
            log.info("Credentials stored successfully: path={}", path);
        } catch (Exception e) {
            log.error("Failed to store credentials in Vault: path={}", path, e);
            throw new VaultException("Failed to store credentials: " + e.getMessage(), e);
        }
    }
    
    @Override
    public Optional<Map<String, Object>> retrieveCredentials(String path) {
        log.debug("Retrieving credentials from Vault: path={}", path);
        
        try {
            @SuppressWarnings("unchecked")
            VaultResponseSupport<Map<String, Object>> response = (VaultResponseSupport<Map<String, Object>>) vaultTemplate.read(path);
            
            if (response == null || response.getData() == null) {
                log.warn("No credentials found in Vault: path={}", path);
                return Optional.empty();
            }
            
            log.debug("Credentials retrieved successfully: path={}", path);
            return Optional.of(response.getData());
            
        } catch (Exception e) {
            log.error("Failed to retrieve credentials from Vault: path={}", path, e);
            throw new VaultException("Failed to retrieve credentials: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void deleteCredentials(String path) {
        log.info("Deleting credentials from Vault: path={}", path);
        
        try {
            vaultTemplate.delete(path);
            log.info("Credentials deleted successfully: path={}", path);
        } catch (Exception e) {
            log.error("Failed to delete credentials from Vault: path={}", path, e);
            throw new VaultException("Failed to delete credentials: " + e.getMessage(), e);
        }
    }
    
    @Override
    public boolean credentialsExist(String path) {
        log.debug("Checking if credentials exist in Vault: path={}", path);
        
        try {
            VaultResponse response = vaultTemplate.read(path);
            boolean exists = response != null && response.getData() != null;
            log.debug("Credentials exist check: path={}, exists={}", path, exists);
            return exists;
        } catch (Exception e) {
            log.error("Failed to check credentials existence in Vault: path={}", path, e);
            return false;
        }
    }
}


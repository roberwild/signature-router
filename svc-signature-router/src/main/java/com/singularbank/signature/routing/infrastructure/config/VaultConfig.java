package com.singularbank.signature.routing.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.vault.authentication.TokenAuthentication;
import org.springframework.vault.client.VaultEndpoint;
import org.springframework.vault.core.VaultTemplate;

import java.net.URI;

/**
 * HashiCorp Vault Configuration
 * Story 13.5: Vault Integration for Credentials
 * Epic 13: Providers CRUD Management
 * 
 * Configures Spring Vault client for HashiCorp Vault integration.
 * 
 * Configuration properties:
 * - vault.enabled: Enable/disable Vault (default: false for dev)
 * - vault.uri: Vault server URI (e.g., http://localhost:8200)
 * - vault.token: Vault authentication token
 */
@Configuration
@ConditionalOnProperty(name = "vault.enabled", havingValue = "true")
@Slf4j
public class VaultConfig {
    
    @Value("${vault.uri:http://localhost:8200}")
    private String vaultUri;
    
    @Value("${vault.token:}")
    private String vaultToken;
    
    @Bean
    public VaultTemplate vaultTemplate() {
        log.info("Configuring VaultTemplate with URI: {}", vaultUri);
        
        VaultEndpoint vaultEndpoint = VaultEndpoint.from(URI.create(vaultUri));
        TokenAuthentication authentication = new TokenAuthentication(vaultToken);
        
        VaultTemplate template = new VaultTemplate(vaultEndpoint, authentication);
        
        log.info("VaultTemplate configured successfully");
        return template;
    }
}

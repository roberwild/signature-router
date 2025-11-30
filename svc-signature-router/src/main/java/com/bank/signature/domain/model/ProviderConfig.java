package com.bank.signature.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config Aggregate Root
 * Story 13.2: Provider Domain Model
 * Epic 13: Providers CRUD Management
 * 
 * Represents the configuration of a signature provider.
 * This is the central entity for dynamic provider management.
 * 
 * Domain Rules:
 * - Provider code must be unique
 * - Priority must be positive
 * - Timeout and retry must be non-negative
 * - Config JSON is validated per provider type
 * - Credentials stored only in Vault (never in this entity)
 * 
 * Lifecycle:
 * - Created with all required fields
 * - Can be enabled/disabled (soft delete)
 * - Configuration can be updated
 * - All changes are audited in ProviderConfigHistory
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderConfig {
    
    /**
     * Unique identifier (UUIDv7 - time sortable)
     */
    private UUID id;
    
    /**
     * Type of provider (SMS, PUSH, VOICE, BIOMETRIC)
     */
    private ProviderType providerType;
    
    /**
     * Human-readable name
     * Example: "Twilio SMS Production"
     */
    private String providerName;
    
    /**
     * Unique code for programmatic reference
     * Example: "twilio-sms-prod"
     * Must be unique across all providers
     */
    private String providerCode;
    
    /**
     * Whether provider is enabled
     * Disabled providers are not used for signature requests
     */
    private boolean enabled;
    
    /**
     * Priority for fallback chain
     * 1 = highest priority, 2 = second, etc.
     * Lower number = higher priority
     */
    private int priority;
    
    /**
     * API timeout in seconds
     * How long to wait for provider response before timing out
     */
    private int timeoutSeconds;
    
    /**
     * Maximum retry attempts on failure
     * 0 = no retries, 3 = up to 3 retries
     */
    private int retryMaxAttempts;
    
    /**
     * Provider-specific configuration (JSONB)
     * Flexible map for provider-specific settings
     * 
     * Examples:
     * - SMS: {"api_url": "https://...", "from_number": "+1234"}
     * - PUSH: {"api_url": "https://...", "fcm_project_id": "..."}
     * - VOICE: {"tts_language": "es-ES", "tts_voice": "Polly.Mia"}
     */
    private Map<String, Object> configJson;
    
    /**
     * Path to credentials in HashiCorp Vault
     * Example: "secret/signature-router/providers/twilio-sms"
     * 
     * Credentials stored in Vault (NOT in this entity):
     * - account_sid
     * - auth_token
     * - api_key
     * - etc.
     */
    private String vaultPath;
    
    /**
     * When provider was created
     */
    private Instant createdAt;
    
    /**
     * When provider was last updated
     */
    private Instant updatedAt;
    
    /**
     * Who created the provider (email/username)
     */
    private String createdBy;
    
    /**
     * Who last updated the provider
     */
    private String updatedBy;
    
    // ========== Business Methods ==========
    
    /**
     * Enable this provider
     * Makes it available for signature requests
     */
    public void enable() {
        this.enabled = true;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Disable this provider (soft delete)
     * Removes it from active use but keeps configuration
     */
    public void disable() {
        this.enabled = false;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Update configuration
     * 
     * @param newConfig New configuration map
     * @param updatedBy Who is updating
     */
    public void updateConfig(Map<String, Object> newConfig, String updatedBy) {
        this.configJson = newConfig;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Update timeout
     * 
     * @param timeoutSeconds New timeout in seconds
     * @param updatedBy Who is updating
     */
    public void updateTimeout(int timeoutSeconds, String updatedBy) {
        if (timeoutSeconds <= 0) {
            throw new IllegalArgumentException("Timeout must be positive");
        }
        this.timeoutSeconds = timeoutSeconds;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Update retry attempts
     * 
     * @param retryMaxAttempts New max retry attempts
     * @param updatedBy Who is updating
     */
    public void updateRetryAttempts(int retryMaxAttempts, String updatedBy) {
        if (retryMaxAttempts < 0) {
            throw new IllegalArgumentException("Retry attempts cannot be negative");
        }
        this.retryMaxAttempts = retryMaxAttempts;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Update priority
     * 
     * @param priority New priority (1 = highest)
     * @param updatedBy Who is updating
     */
    public void updatePriority(int priority, String updatedBy) {
        if (priority <= 0) {
            throw new IllegalArgumentException("Priority must be positive");
        }
        this.priority = priority;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }
    
    /**
     * Check if provider is active
     * 
     * @return true if enabled and ready to use
     */
    public boolean isActive() {
        return this.enabled;
    }
    
    /**
     * Validate provider configuration
     * Throws exception if invalid
     */
    public void validate() {
        if (providerType == null) {
            throw new IllegalStateException("Provider type is required");
        }
        if (providerName == null || providerName.isBlank()) {
            throw new IllegalStateException("Provider name is required");
        }
        if (providerCode == null || providerCode.isBlank()) {
            throw new IllegalStateException("Provider code is required");
        }
        if (priority <= 0) {
            throw new IllegalStateException("Priority must be positive");
        }
        if (timeoutSeconds <= 0) {
            throw new IllegalStateException("Timeout must be positive");
        }
        if (retryMaxAttempts < 0) {
            throw new IllegalStateException("Retry attempts cannot be negative");
        }
        if (configJson == null || configJson.isEmpty()) {
            throw new IllegalStateException("Config JSON is required");
        }
        if (vaultPath == null || vaultPath.isBlank()) {
            throw new IllegalStateException("Vault path is required");
        }
    }
    
    @Override
    public String toString() {
        return String.format("ProviderConfig{code='%s', type=%s, enabled=%s, priority=%d}",
            providerCode, providerType, enabled, priority);
    }
}


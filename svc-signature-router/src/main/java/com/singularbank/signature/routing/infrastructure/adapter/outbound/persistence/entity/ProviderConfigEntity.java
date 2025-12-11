package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity;

import com.singularbank.signature.routing.domain.model.ProviderType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config JPA Entity
 * Story 13.2: Provider Domain Model & Repository
 * Epic 13: Providers CRUD Management
 * 
 * JPA entity for provider_config table.
 * Maps to domain model ProviderConfig.
 */
@Entity
@Table(name = "provider_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderConfigEntity {
    
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false, length = 20)
    private ProviderType providerType;
    
    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;
    
    @Column(name = "provider_code", nullable = false, length = 50, unique = true)
    private String providerCode;
    
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    
    @Column(name = "priority", nullable = false)
    private int priority;
    
    @Column(name = "timeout_seconds", nullable = false)
    private int timeoutSeconds;
    
    @Column(name = "retry_max_attempts", nullable = false)
    private int retryMaxAttempts;
    
    @Type(JsonType.class)
    @Column(name = "config_json", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> configJson;
    
    @Column(name = "vault_path", nullable = false, length = 500)
    private String vaultPath;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}


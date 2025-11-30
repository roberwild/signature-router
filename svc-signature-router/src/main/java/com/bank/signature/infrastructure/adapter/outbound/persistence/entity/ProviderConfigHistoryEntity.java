package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config History JPA Entity
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
@Entity
@Table(name = "provider_config_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderConfigHistoryEntity {
    
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    
    @Column(name = "provider_config_id", nullable = false)
    private UUID providerConfigId;
    
    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;
    
    @Column(name = "changed_by", length = 100)
    private String changedBy;
    
    @Column(name = "change_type", length = 50, nullable = false)
    private String changeType;
    
    @Type(JsonType.class)
    @Column(name = "old_config_json", columnDefinition = "jsonb")
    private Map<String, Object> oldConfigJson;
    
    @Type(JsonType.class)
    @Column(name = "new_config_json", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> newConfigJson;
    
    @Column(name = "remarks", length = 500)
    private String remarks;
    
    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = Instant.now();
        }
    }
}


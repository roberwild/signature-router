package com.bank.signature.domain.event;

import com.bank.signature.domain.model.ProviderType;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config Domain Event
 * Story 13.2: Provider Domain Model
 * Epic 13: Providers CRUD Management
 * 
 * Base event for provider configuration changes.
 * Published when providers are created, updated, deleted, or state changes.
 * 
 * Consumers can listen to these events for:
 * - Hot reload of provider registry
 * - Audit logging
 * - Notifications to admins
 * - Metrics tracking
 */
@Builder
public record ProviderConfigEvent(
    UUID eventId,
    UUID providerConfigId,
    String providerCode,
    ProviderType providerType,
    ProviderConfigAction action,
    Map<String, Object> changes,
    String triggeredBy,
    Instant occurredAt,
    String reason
) {
    
    /**
     * Action performed on provider config
     */
    public enum ProviderConfigAction {
        /**
         * New provider created
         */
        CREATED,
        
        /**
         * Provider configuration updated
         */
        UPDATED,
        
        /**
         * Provider deleted (soft delete - disabled)
         */
        DELETED,
        
        /**
         * Provider enabled
         */
        ENABLED,
        
        /**
         * Provider disabled
         */
        DISABLED,
        
        /**
         * Provider connection tested
         */
        TESTED
    }
    
    /**
     * Create CREATED event
     */
    public static ProviderConfigEvent created(UUID providerConfigId, String providerCode, 
                                             ProviderType providerType, String createdBy) {
        return ProviderConfigEvent.builder()
            .eventId(UUID.randomUUID())
            .providerConfigId(providerConfigId)
            .providerCode(providerCode)
            .providerType(providerType)
            .action(ProviderConfigAction.CREATED)
            .triggeredBy(createdBy)
            .occurredAt(Instant.now())
            .build();
    }
    
    /**
     * Create UPDATED event
     */
    public static ProviderConfigEvent updated(UUID providerConfigId, String providerCode,
                                             ProviderType providerType, Map<String, Object> changes,
                                             String updatedBy, String reason) {
        return ProviderConfigEvent.builder()
            .eventId(UUID.randomUUID())
            .providerConfigId(providerConfigId)
            .providerCode(providerCode)
            .providerType(providerType)
            .action(ProviderConfigAction.UPDATED)
            .changes(changes)
            .triggeredBy(updatedBy)
            .occurredAt(Instant.now())
            .reason(reason)
            .build();
    }
    
    /**
     * Create ENABLED event
     */
    public static ProviderConfigEvent enabled(UUID providerConfigId, String providerCode,
                                             ProviderType providerType, String enabledBy) {
        return ProviderConfigEvent.builder()
            .eventId(UUID.randomUUID())
            .providerConfigId(providerConfigId)
            .providerCode(providerCode)
            .providerType(providerType)
            .action(ProviderConfigAction.ENABLED)
            .triggeredBy(enabledBy)
            .occurredAt(Instant.now())
            .build();
    }
    
    /**
     * Create DISABLED event
     */
    public static ProviderConfigEvent disabled(UUID providerConfigId, String providerCode,
                                              ProviderType providerType, String disabledBy, String reason) {
        return ProviderConfigEvent.builder()
            .eventId(UUID.randomUUID())
            .providerConfigId(providerConfigId)
            .providerCode(providerCode)
            .providerType(providerType)
            .action(ProviderConfigAction.DISABLED)
            .triggeredBy(disabledBy)
            .occurredAt(Instant.now())
            .reason(reason)
            .build();
    }
}


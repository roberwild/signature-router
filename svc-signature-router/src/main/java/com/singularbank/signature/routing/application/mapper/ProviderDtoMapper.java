package com.singularbank.signature.routing.application.mapper;

import com.singularbank.signature.routing.application.dto.request.CreateProviderRequest;
import com.singularbank.signature.routing.application.dto.request.UpdateProviderRequest;
import com.singularbank.signature.routing.application.dto.response.ProviderResponse;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Provider DTO Mapper
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 */
@Component
public class ProviderDtoMapper {
    
    // MOCK: MuleSoft status options for visual variety
    private static final String[] MULESOFT_STATUSES = {"available", "available", "available", "configured", "down"};
    private static final String[] HEALTH_STATUSES = {"healthy", "healthy", "healthy", "unhealthy", "unknown"};
    
    public ProviderConfig toDomain(CreateProviderRequest request, String createdBy) {
        return ProviderConfig.builder()
            .id(UUID.randomUUID())
            .providerType(request.getProviderType())
            .providerName(request.getProviderName())
            .providerCode(request.getProviderCode())
            .enabled(request.isEnabled())
            .priority(request.getPriority())
            .timeoutSeconds(request.getTimeoutSeconds())
            .retryMaxAttempts(request.getRetryMaxAttempts())
            .configJson(request.getConfigJson())
            .vaultPath(request.getVaultPath())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .createdBy(createdBy)
            .updatedBy(createdBy)
            .build();
    }
    
    public ProviderConfig updateDomain(ProviderConfig existing, UpdateProviderRequest request, String updatedBy) {
        return ProviderConfig.builder()
            .id(existing.getId())
            .providerType(existing.getProviderType())
            .providerName(request.getProviderName() != null ? request.getProviderName() : existing.getProviderName())
            .providerCode(existing.getProviderCode())
            .enabled(request.getEnabled() != null ? request.getEnabled() : existing.isEnabled())
            .priority(request.getPriority() != null ? request.getPriority() : existing.getPriority())
            .timeoutSeconds(request.getTimeoutSeconds() != null ? request.getTimeoutSeconds() : existing.getTimeoutSeconds())
            .retryMaxAttempts(request.getRetryMaxAttempts() != null ? request.getRetryMaxAttempts() : existing.getRetryMaxAttempts())
            .configJson(request.getConfigJson() != null ? request.getConfigJson() : existing.getConfigJson())
            .vaultPath(request.getVaultPath() != null ? request.getVaultPath() : existing.getVaultPath())
            .createdAt(existing.getCreatedAt())
            .updatedAt(Instant.now())
            .createdBy(existing.getCreatedBy())
            .updatedBy(updatedBy)
            .build();
    }
    
    public ProviderResponse toResponse(ProviderConfig domain) {
        // Generate deterministic mock data based on provider ID hash
        // This ensures same provider always shows same status (consistent UX)
        int hash = domain.getId().hashCode();
        int statusIndex = Math.abs(hash % 5);
        
        String muleSoftStatus = MULESOFT_STATUSES[statusIndex];
        String healthStatus = HEALTH_STATUSES[statusIndex];
        
        // If provider is disabled, show as "configured" in MuleSoft and "unknown" health
        if (!domain.isEnabled()) {
            muleSoftStatus = "configured";
            healthStatus = "unknown";
        }
        
        // If MuleSoft is down, health should be unhealthy
        if ("down".equals(muleSoftStatus)) {
            healthStatus = "unhealthy";
        }
        
        // Generate mock metrics (deterministic based on hash)
        int requestsToday = 100 + Math.abs(hash % 5000);
        double successRate = 85.0 + (Math.abs(hash % 150) / 10.0); // 85-100%
        int avgLatency = 50 + Math.abs(hash % 400); // 50-450ms
        Integer healthLatency = "healthy".equals(healthStatus) ? (20 + Math.abs(hash % 200)) : null;
        
        return ProviderResponse.builder()
            .id(domain.getId())
            .providerType(domain.getProviderType())
            .providerName(domain.getProviderName())
            .providerCode(domain.getProviderCode())
            .enabled(domain.isEnabled())
            .priority(domain.getPriority())
            .timeoutSeconds(domain.getTimeoutSeconds())
            .retryMaxAttempts(domain.getRetryMaxAttempts())
            .configJson(domain.getConfigJson())
            .vaultPath(domain.getVaultPath())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .createdBy(domain.getCreatedBy())
            .updatedBy(domain.getUpdatedBy())
            // MOCK: MuleSoft integration fields
            .muleSoftProviderId("MULESOFT_" + domain.getProviderCode())
            .muleSoftEndpoint("https://mulesoft.singularbank.com/api/v1/providers/" + domain.getProviderCode().toLowerCase())
            .muleSoftStatus(muleSoftStatus)
            .healthStatus(healthStatus)
            .lastHealthCheckAt(Instant.now().minusSeconds(30 + Math.abs(hash % 300)))
            .lastHealthLatency("healthy".equals(healthStatus) ? healthLatency : null)
            .lastSyncAt(Instant.now().minusSeconds(60 + Math.abs(hash % 600)))
            // MOCK: Metrics
            .requestsToday(domain.isEnabled() ? requestsToday : 0)
            .successRate(domain.isEnabled() ? successRate : null)
            .avgLatency(domain.isEnabled() ? avgLatency : null)
            .fallbackCount(domain.isEnabled() ? Math.abs(hash % 50) : 0)
            .lastUsedAt(domain.isEnabled() ? Instant.now().minusSeconds(Math.abs(hash % 3600)) : null)
            .build();
    }
}


package com.bank.signature.application.mapper;

import com.bank.signature.application.dto.request.CreateProviderRequest;
import com.bank.signature.application.dto.request.UpdateProviderRequest;
import com.bank.signature.application.dto.response.ProviderResponse;
import com.bank.signature.domain.model.ProviderConfig;
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
            .build();
    }
}


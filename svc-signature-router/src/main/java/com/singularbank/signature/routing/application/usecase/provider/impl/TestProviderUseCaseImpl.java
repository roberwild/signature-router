package com.singularbank.signature.routing.application.usecase.provider.impl;

import com.singularbank.signature.routing.application.dto.response.TestProviderResponse;
import com.singularbank.signature.routing.application.usecase.provider.TestProviderUseCase;
import com.singularbank.signature.routing.domain.event.ProviderConfigEvent;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import com.singularbank.signature.routing.domain.port.outbound.VaultCredentialsPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Test Provider Use Case Implementation
 * Story 13.8: Provider Testing & Validation
 * Epic 13: Providers CRUD Management
 * 
 * Mock implementation that simulates provider testing.
 * In a real implementation, this would actually call the provider API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TestProviderUseCaseImpl implements TestProviderUseCase {
    
    private final ProviderConfigRepository repository;
    private final VaultCredentialsPort vaultPort;
    private final ApplicationEventPublisher eventPublisher;
    
    @Override
    public TestProviderResponse execute(UUID providerId, String testDestination, String testMessage) {
        log.info("Testing provider: id={}, destination={}", providerId, testDestination);
        
        Instant startTime = Instant.now();
        
        try {
            // Get provider config
            ProviderConfig provider = repository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));
            
            // Check if provider is enabled
            if (!provider.isEnabled()) {
                return TestProviderResponse.builder()
                    .success(false)
                    .message("Provider is disabled")
                    .responseTimeMs(0)
                    .testedAt(startTime)
                    .errorDetails("Provider must be enabled before testing")
                    .build();
            }
            
            // Get credentials from Vault
            Map<String, Object> credentials = vaultPort.retrieveCredentials(provider.getVaultPath())
                .orElse(null);
            
            if (credentials == null || credentials.isEmpty()) {
                return TestProviderResponse.builder()
                    .success(false)
                    .message("Credentials not found in Vault")
                    .responseTimeMs(0)
                    .testedAt(startTime)
                    .errorDetails("No credentials found at vault path: " + provider.getVaultPath())
                    .build();
            }
            
            // Mock test (in real implementation, call provider API here)
            log.info("Simulating test call to {} provider: {}", provider.getProviderType(), provider.getProviderCode());
            
            // Simulate network delay based on provider timeout
            Thread.sleep(Math.min(provider.getTimeoutSeconds() * 100L, 500L));
            
            Instant endTime = Instant.now();
            long responseTimeMs = endTime.toEpochMilli() - startTime.toEpochMilli();
            
            // Publish test event
            ProviderConfigEvent event = ProviderConfigEvent.builder()
                .eventId(UUID.randomUUID())
                .providerConfigId(provider.getId())
                .providerCode(provider.getProviderCode())
                .providerType(provider.getProviderType())
                .action(ProviderConfigEvent.ProviderConfigAction.TESTED)
                .triggeredBy("test")
                .occurredAt(Instant.now())
                .build();
            eventPublisher.publishEvent(event);
            
            log.info("Provider test successful: id={}, responseTimeMs={}", providerId, responseTimeMs);
            
            return TestProviderResponse.builder()
                .success(true)
                .message("Provider test successful")
                .responseTimeMs(responseTimeMs)
                .testedAt(startTime)
                .build();
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return buildErrorResponse(startTime, "Test interrupted", e.getMessage());
        } catch (Exception e) {
            log.error("Provider test failed: id={}", providerId, e);
            return buildErrorResponse(startTime, "Provider test failed", e.getMessage());
        }
    }
    
    private TestProviderResponse buildErrorResponse(Instant startTime, String message, String errorDetails) {
        Instant endTime = Instant.now();
        long responseTimeMs = endTime.toEpochMilli() - startTime.toEpochMilli();
        
        return TestProviderResponse.builder()
            .success(false)
            .message(message)
            .responseTimeMs(responseTimeMs)
            .testedAt(startTime)
            .errorDetails(errorDetails)
            .build();
    }
}


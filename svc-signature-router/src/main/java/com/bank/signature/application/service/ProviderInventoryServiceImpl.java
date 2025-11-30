package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;
import com.bank.signature.application.dto.response.ProviderListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of Provider Inventory Service
 * Story 12.3: Providers Read-Only Endpoint
 * 
 * Lists configured providers from health service.
 * This is a read-only view of providers configured in the system.
 * 
 * Note: Providers are currently hardcoded in configuration/beans.
 * CRUD operations for providers would be implemented in future Epic 13.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderInventoryServiceImpl implements ProviderInventoryService {
    
    private final ProviderHealthService providerHealthService;
    
    /**
     * Get all configured providers with health status
     * 
     * @return List of providers
     */
    @Override
    public List<ProviderListResponse> getAllProviders() {
        log.info("Retrieving all configured providers");
        
        AggregatedHealthResponse healthResponse = providerHealthService.getProvidersHealth(false);
        
        List<ProviderListResponse> providers = healthResponse.providers().stream()
            .map(this::mapToProviderResponse)
            .collect(Collectors.toList());
        
        log.info("Retrieved {} providers", providers.size());
        
        return providers;
    }
    
    /**
     * Get single provider by ID
     * 
     * @param providerId Provider unique identifier
     * @return Provider information
     * @throws IllegalArgumentException if provider not found
     */
    @Override
    public ProviderListResponse getProviderById(String providerId) {
        log.info("Retrieving provider: {}", providerId);
        
        return getAllProviders().stream()
            .filter(p -> p.id().equals(providerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));
    }
    
    /**
     * Map health response to provider list response
     */
    private ProviderListResponse mapToProviderResponse(AggregatedHealthResponse.ProviderHealth providerHealth) {
        // Extract provider info from name
        String providerId = extractProviderId(providerHealth.name());
        String providerName = extractProviderName(providerHealth.name(), providerHealth.type());
        
        // Map health status
        ProviderListResponse.HealthStatus health = ProviderListResponse.HealthStatus.builder()
            .status(providerHealth.status())
            .lastCheck(providerHealth.lastCheckTimestamp())
            .latency(providerHealth.latencyMs())
            .errorMessage(providerHealth.errorMessage())
            .build();
        
        // Create masked config
        Map<String, String> config = createMaskedConfig(providerHealth.type());
        
        // Determine if provider is enabled (UP = enabled)
        boolean enabled = "UP".equals(providerHealth.status());
        
        return ProviderListResponse.builder()
            .id(providerId)
            .name(providerName)
            .type(providerHealth.type())
            .enabled(enabled)
            .priority(determinePriority(providerHealth.type()))
            .health(health)
            .config(config)
            .build();
    }
    
    /**
     * Extract provider ID from bean name
     */
    private String extractProviderId(String beanName) {
        // Convert camelCase to kebab-case
        // e.g., "smsProvider" -> "twilio-sms"
        return switch (beanName) {
            case "smsProvider" -> "twilio-sms";
            case "pushProvider" -> "firebase-fcm";
            case "voiceProvider" -> "twilio-voice";
            case "biometricProvider" -> "biocatch";
            default -> beanName.replaceAll("([a-z])([A-Z])", "$1-$2").toLowerCase();
        };
    }
    
    /**
     * Extract provider display name
     */
    private String extractProviderName(String beanName, String type) {
        return switch (beanName) {
            case "smsProvider" -> "Twilio SMS";
            case "pushProvider" -> "Firebase FCM";
            case "voiceProvider" -> "Twilio Voice";
            case "biometricProvider" -> "BioCatch Biometric";
            default -> type + " Provider";
        };
    }
    
    /**
     * Determine provider priority based on type
     */
    private int determinePriority(String type) {
        return switch (type) {
            case "SMS" -> 1;
            case "PUSH" -> 1;
            case "VOICE" -> 1;
            case "BIOMETRIC" -> 2;
            default -> 99;
        };
    }
    
    /**
     * Create masked configuration (no secrets exposed)
     */
    private Map<String, String> createMaskedConfig(String type) {
        Map<String, String> config = new HashMap<>();
        
        switch (type) {
            case "SMS" -> {
                config.put("accountSidMasked", "AC***************");
                config.put("fromNumber", "+34912345678");
            }
            case "PUSH" -> {
                config.put("serverKeyMasked", "AAAA***************");
            }
            case "VOICE" -> {
                config.put("accountSidMasked", "AC***************");
                config.put("fromNumber", "+34987654321");
            }
            case "BIOMETRIC" -> {
                config.put("apiKeyMasked", "BC***************");
            }
        }
        
        return config;
    }
}


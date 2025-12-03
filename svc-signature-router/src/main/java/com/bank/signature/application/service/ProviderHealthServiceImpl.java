package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;
import com.bank.signature.application.dto.response.ProviderHealthResponse;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Provider Health Service Implementation.
 * Story 3.7: Provider Health Check Endpoint
 * 
 * Checks health of all signature providers and returns aggregated status.
 * 
 * Features:
 * - Discovers providers dynamically from Spring context
 * - Measures latency per provider health check
 * - Handles errors gracefully (DOWN status with error message)
 * - Aggregates to overall status: UP/DEGRADED/DOWN
 * 
 * Performance:
 * - Sequential health checks (simple, sufficient for 4 providers)
 * - Each provider check: ~5-200ms (uses cached status 30s TTL)
 * - Total response time: ~50-500ms
 * 
 * @since Story 3.7
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderHealthServiceImpl implements ProviderHealthService {
    
    private final ApplicationContext context;
    private final MeterRegistry meterRegistry;
    
    @Override
    public AggregatedHealthResponse getProvidersHealth(boolean forceRefresh) {
        log.info("Checking provider health (forceRefresh={})", forceRefresh);
        
        // Discover all provider beans
        Map<String, SignatureProviderPort> providers = context.getBeansOfType(SignatureProviderPort.class);
        
        if (providers.isEmpty()) {
            log.warn("No providers found - all providers disabled or not configured");
            return AggregatedHealthResponse.from(List.of());
        }
        
        List<ProviderHealthResponse> healthResponses = new ArrayList<>();
        
        // Check health of each provider
        for (Map.Entry<String, SignatureProviderPort> entry : providers.entrySet()) {
            String beanName = entry.getKey();
            SignatureProviderPort provider = entry.getValue();
            
            // Skip meta-adapters (SignatureProviderAdapter is a router, not a real provider)
            if (beanName.equals("signatureProviderAdapter")) {
                log.debug("Skipping meta-adapter: {}", beanName);
                continue;
            }
            
            ProviderHealthResponse healthResponse = checkProviderHealth(beanName, provider);
            healthResponses.add(healthResponse);
        }
        
        // Aggregate and return
        AggregatedHealthResponse response = AggregatedHealthResponse.from(healthResponses);
        
        log.info("Provider health check complete: overallStatus={}, providers={}", 
            response.overallStatus(), healthResponses.size());
        
        return response;
    }
    
    /**
     * Checks health of a single provider.
     * 
     * Measures latency and handles errors gracefully.
     * 
     * @param beanName Provider bean name (e.g., "smsProvider")
     * @param provider Provider instance
     * @return ProviderHealthResponse with status and details
     */
    private ProviderHealthResponse checkProviderHealth(String beanName, SignatureProviderPort provider) {
        try {
            log.debug("Checking health: {}", beanName);
            
            ProviderType providerType = mapBeanNameToProviderType(beanName);
            Instant startTime = Instant.now();
            Timer.Sample sample = Timer.start(meterRegistry);
            
            // Call provider health check
            HealthStatus healthStatus = provider.checkHealth(providerType);
            
            // Measure latency
            long latencyMs = sample.stop(meterRegistry.timer("provider.health.check.latency", 
                "provider", beanName, "status", healthStatus.status().name()));
            
            boolean isHealthy = healthStatus.isHealthy();
            
            log.debug("Provider {} health: {} - {} (latency: {}ms)", 
                beanName, isHealthy ? "UP" : "DOWN", healthStatus.details(), latencyMs);
            
            if (isHealthy) {
                return ProviderHealthResponse.up(
                    beanName,
                    providerType,
                    healthStatus.details(),
                    healthStatus.timestamp(),
                    latencyMs
                );
            } else {
                return ProviderHealthResponse.down(
                    beanName,
                    providerType,
                    healthStatus.details(),
                    healthStatus.timestamp(),
                    latencyMs,
                    healthStatus.details() // Use details as error message
                );
            }
            
        } catch (Exception e) {
            log.error("Health check FAILED for {}: {}", beanName, e.getMessage(), e);
            
            return ProviderHealthResponse.down(
                beanName,
                mapBeanNameToProviderType(beanName),
                "Health check error",
                Instant.now(),
                null,
                e.getMessage()
            );
        }
    }
    
    /**
     * Maps Spring bean name to ProviderType enum.
     * 
     * Mapping:
     * - smsProvider, twilioSmsProvider → ProviderType.SMS
     * - pushProvider, pushNotificationProvider → ProviderType.PUSH
     * - voiceProvider, voiceCallProvider → ProviderType.VOICE
     * - biometricProvider → ProviderType.BIOMETRIC
     * 
     * @param beanName Provider bean name
     * @return Corresponding ProviderType
     * @throws IllegalArgumentException if bean name not recognized
     */
    private ProviderType mapBeanNameToProviderType(String beanName) {
        return switch (beanName) {
            case "smsProvider", "twilioSmsProvider" -> ProviderType.SMS;
            case "pushProvider", "pushNotificationProvider" -> ProviderType.PUSH;
            case "voiceProvider", "voiceCallProvider" -> ProviderType.VOICE;
            case "biometricProvider" -> ProviderType.BIOMETRIC;
            default -> throw new IllegalArgumentException("Unknown provider bean: " + beanName);
        };
    }
}


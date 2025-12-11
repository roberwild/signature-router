package com.singularbank.signature.routing.infrastructure.health;

import com.singularbank.signature.routing.domain.model.valueobject.HealthStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.SignatureProviderPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Health Indicator for all Signature Providers.
 * Story 3.6: Provider Configuration Management
 * 
 * Aggregates health status of all active signature providers
 * (SMS, Push, Voice, Biometric) and reports overall system health.
 * 
 * Health Status Levels:
 * - **UP**: All providers operational
 * - **DEGRADED**: Some providers down (fallback available)
 * - **DOWN**: All providers down (system unhealthy)
 * 
 * Endpoint:
 * - GET /actuator/health/providers
 * - Requires ROLE_ADMIN (configured in security)
 * - Returns JSON with per-provider status
 * 
 * Performance:
 * - Parallel health checks (CompletableFuture) for efficiency
 * - 2-second timeout per provider check
 * - Cached results (30s TTL) in each provider's checkHealth()
 * 
 * Example Response:
 * <pre>
 * {
 *   "status": "UP",
 *   "components": {
 *     "providers": {
 *       "status": "UP",
 *       "details": {
 *         "smsProvider": "UP: Twilio SMS operational",
 *         "pushProvider": "UP: FCM Push operational",
 *         "voiceProvider": "DOWN: Voice provider disabled",
 *         "biometricProvider": "DOWN: Biometric provider disabled"
 *       }
 *     }
 *   }
 * }
 * </pre>
 * 
 * Bean Activation:
 * - @ConditionalOnProperty allows disabling via config
 * - Default: enabled (matchIfMissing = true)
 * - Disable via: management.health.providers.enabled=false
 * 
 * @since Story 3.6
 * @see org.springframework.boot.actuate.health.HealthIndicator
 * @see SignatureProviderPort#checkHealth(ProviderType)
 */
@Component("allProvidersHealthIndicator")
@ConditionalOnProperty(name = "management.health.providers.enabled", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class ProviderHealthIndicator implements HealthIndicator {
    
    private final ApplicationContext context;
    
    // Timeout for individual provider health checks
    private static final Duration HEALTH_CHECK_TIMEOUT = Duration.ofSeconds(2);
    
    /**
     * Checks health of all signature providers.
     * 
     * Strategy:
     * 1. Discover all SignatureProviderPort beans from Spring context
     * 2. Execute health checks in parallel (CompletableFuture)
     * 3. Timeout after 2 seconds per provider (prevent slow health checks)
     * 4. Aggregate results: UP if all up, DEGRADED if some down, DOWN if all down
     * 
     * Provider Type Mapping:
     * - smsProvider → ProviderType.SMS
     * - pushProvider → ProviderType.PUSH
     * - voiceProvider → ProviderType.VOICE
     * - biometricProvider → ProviderType.BIOMETRIC
     * 
     * @return Health status with per-provider details
     */
    @Override
    public Health health() {
        log.debug("Executing provider health check...");
        
        // Discover all provider beans
        Map<String, SignatureProviderPort> providers = context.getBeansOfType(SignatureProviderPort.class);
        
        if (providers.isEmpty()) {
            log.warn("No providers found - all providers disabled or not configured");
            return Health.down()
                .withDetail("message", "No signature providers available")
                .build();
        }
        
        Health.Builder builder = Health.up();
        int upCount = 0;
        int downCount = 0;
        
        // Execute health checks in parallel for performance
        ExecutorService executor = Executors.newFixedThreadPool(providers.size());
        Map<String, CompletableFuture<HealthCheckResult>> futures = new ConcurrentHashMap<>();
        
        for (Map.Entry<String, SignatureProviderPort> entry : providers.entrySet()) {
            String beanName = entry.getKey();
            SignatureProviderPort provider = entry.getValue();
            
            // Skip meta-adapters (SignatureProviderAdapter is a router, not a real provider)
            if (beanName.equals("signatureProviderAdapter")) {
                log.debug("Skipping meta-adapter: {}", beanName);
                continue;
            }
            
            CompletableFuture<HealthCheckResult> future = CompletableFuture.supplyAsync(
                () -> checkProvider(beanName, provider),
                executor
            ).orTimeout(HEALTH_CHECK_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)
             .exceptionally(ex -> {
                 log.error("Health check TIMEOUT for {}: {}", beanName, ex.getMessage());
                 return new HealthCheckResult(beanName, false, "TIMEOUT: " + ex.getMessage());
             });
            
            futures.put(beanName, future);
        }
        
        // Wait for all health checks to complete
        try {
            for (Map.Entry<String, CompletableFuture<HealthCheckResult>> entry : futures.entrySet()) {
                HealthCheckResult result = entry.getValue().get();
                
                if (result.isHealthy) {
                    builder.withDetail(result.providerName, "UP: " + result.details);
                    upCount++;
                } else {
                    builder.withDetail(result.providerName, "DOWN: " + result.details);
                    downCount++;
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error aggregating provider health checks", e);
            return Health.down()
                .withDetail("error", "Failed to aggregate provider health: " + e.getMessage())
                .build();
        } finally {
            executor.shutdown();
        }
        
        // Determine overall health status
        int totalProviders = upCount + downCount;
        
        if (downCount == 0) {
            // All providers UP
            log.debug("Provider health check: ALL UP ({} providers)", totalProviders);
            return builder.up().build();
        } else if (upCount == 0) {
            // All providers DOWN
            log.warn("Provider health check: ALL DOWN ({} providers)", totalProviders);
            return builder.down()
                .withDetail("message", "All signature providers are unavailable")
                .build();
        } else {
            // Some providers UP, some DOWN → DEGRADED
            log.warn("Provider health check: DEGRADED ({} UP, {} DOWN)", upCount, downCount);
            return builder.status("DEGRADED")
                .withDetail("message", String.format("%d/%d providers available (degraded mode)", upCount, totalProviders))
                .build();
        }
    }
    
    /**
     * Checks health of a single provider.
     * 
     * Maps bean name to ProviderType and calls provider.checkHealth().
     * 
     * @param beanName Provider bean name (e.g., "smsProvider")
     * @param provider Provider instance
     * @return HealthCheckResult with status and details
     */
    private HealthCheckResult checkProvider(String beanName, SignatureProviderPort provider) {
        try {
            log.debug("Checking health of provider: {}", beanName);
            
            ProviderType providerType = mapBeanNameToProviderType(beanName);
            HealthStatus healthStatus = provider.checkHealth(providerType);
            
            boolean isHealthy = healthStatus.isHealthy();
            String details = healthStatus.details();
            
            log.debug("Provider {} health: {} - {}", beanName, 
                isHealthy ? "HEALTHY" : "UNHEALTHY", details);
            
            return new HealthCheckResult(beanName, isHealthy, details);
            
        } catch (Exception e) {
            log.error("Health check FAILED for {}: {}", beanName, e.getMessage(), e);
            return new HealthCheckResult(beanName, false, "ERROR: " + e.getMessage());
        }
    }
    
    /**
     * Maps Spring bean name to ProviderType enum.
     * 
     * Mapping:
     * - smsProvider → ProviderType.SMS
     * - pushProvider → ProviderType.PUSH
     * - voiceProvider → ProviderType.VOICE
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
    
    /**
     * Internal DTO for health check results.
     */
    private record HealthCheckResult(
        String providerName,
        boolean isHealthy,
        String details
    ) {}
}


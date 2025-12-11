package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider;

import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.HealthStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderResult;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.SignatureProviderPort;
import com.singularbank.signature.routing.infrastructure.observability.metrics.ProviderMetrics;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeoutException;

/**
 * Adapter that decorates provider calls with Resilience4j TimeLimiter.
 * Story 3.8: Provider Timeout Configuration
 * 
 * <p>This adapter wraps all provider calls with timeout protection using Resilience4j
 * TimeLimiter. It delegates to the actual provider implementations (TwilioSmsProvider,
 * PushNotificationProvider, etc.) but adds timeout handling and metrics.
 * 
 * <p><strong>Timeout Configuration:</strong>
 * <ul>
 * <li>SMS → {@code smsTimeout} (5s default)</li>
 * <li>PUSH → {@code pushTimeout} (3s default)</li>
 * <li>VOICE → {@code voiceTimeout} (10s default)</li>
 * <li>BIOMETRIC → {@code biometricTimeout} (2s default)</li>
 * </ul>
 * 
 * <p><strong>Timeout Behavior:</strong>
 * When a provider exceeds the configured timeout:
 * <ol>
 * <li>TimeLimiter cancels the CompletableFuture (cancelRunningFuture=true)</li>
 * <li>Timeout event logged at WARNING level with traceId</li>
 * <li>Prometheus counter {@code provider.timeout.total} incremented</li>
 * <li>ProviderResult.timeout() returned with timedOut=true</li>
 * </ol>
 * 
 * <p><strong>Integration with Hexagonal Architecture:</strong>
 * This adapter is part of the infrastructure layer. The domain layer remains
 * pure and unaware of Resilience4j. ChallengeServiceImpl can call providers
 * through this adapter to get timeout protection.
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // Inject SignatureProviderAdapter instead of direct provider
 * @Autowired
 * private Map<String, SignatureProviderAdapter> providerAdapters;
 * 
 * // Call with timeout protection
 * SignatureProviderAdapter adapter = providerAdapters.get("smsProviderAdapter");
 * ProviderResult result = adapter.sendChallenge(challenge, phoneNumber);
 * 
 * if (result.isTimeout()) {
 *     // Timeout occurred - may trigger fallback
 *     log.warn("Provider timed out, attempting fallback...");
 * }
 * }</pre>
 * 
 * @since Story 3.8 - Provider Timeout Configuration
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SignatureProviderAdapter implements SignatureProviderPort {
    
    private final Map<String, SignatureProviderPort> providerMap;
    private final TimeLimiterRegistry timeLimiterRegistry;
    private final MeterRegistry meterRegistry;
    private final ScheduledExecutorService providerExecutorService;
    private final ProviderMetrics providerMetrics;
    
    /**
     * Sends a challenge with timeout protection.
     * 
     * <p>This method decorates the provider's async call with TimeLimiter,
     * providing timeout protection and automatic cancellation on timeout.
     * 
     * <p><strong>Flow:</strong>
     * <ol>
     * <li>Determine provider type from challenge</li>
     * <li>Select appropriate TimeLimiter instance (smsTimeout, pushTimeout, etc.)</li>
     * <li>Get provider from provider map</li>
     * <li>Call provider.sendChallengeAsync() and decorate with TimeLimiter</li>
     * <li>Wait for completion or timeout</li>
     * <li>Handle result or timeout exception</li>
     * </ol>
     * 
     * @param challenge the signature challenge to send
     * @param recipient the recipient identifier
     * @return ProviderResult with success/failure/timeout status
     * @throws IllegalArgumentException if challenge or recipient is null/invalid
     */
    @Override
    public ProviderResult sendChallenge(SignatureChallenge challenge, String recipient) {
        if (challenge == null) {
            throw new IllegalArgumentException("challenge cannot be null");
        }
        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException("recipient cannot be null or blank");
        }
        
        ProviderType providerType = challenge.getProvider();
        Instant startTime = Instant.now();
        
        // Select TimeLimiter instance based on provider type
        String timeLimiterName = getTimeLimiterName(providerType);
        TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(timeLimiterName);
        
        // Get actual provider implementation
        SignatureProviderPort provider = getProviderImplementation(providerType);
        
        log.debug("Sending challenge with timeout protection: challengeId={}, provider={}, timeout={}", 
            challenge.getId(), providerType, timeLimiterName);
        
        try {
            // Execute async provider call with TimeLimiter timeout protection
            // TimeLimiter.executeCompletionStage() requires ScheduledExecutorService and Supplier<CompletionStage>
            CompletableFuture<ProviderResult> timeoutProtectedFuture = timeLimiter
                .executeCompletionStage(
                    providerExecutorService,
                    () -> provider.sendChallengeAsync(challenge, recipient)
                )
                .toCompletableFuture();
            
            // Wait for completion (blocks until timeout or success)
            ProviderResult result = timeoutProtectedFuture.get();
            
            Instant endTime = Instant.now();
            Duration duration = Duration.between(startTime, endTime);
            long durationMs = duration.toMillis();
            
            log.debug("Provider responded successfully: challengeId={}, provider={}, duration={}ms", 
                challenge.getId(), providerType, durationMs);
            
            // Record provider call metrics (Story 3.10 AC1, AC3, AC6)
            providerMetrics.recordProviderCall(
                providerType.name(),
                challenge.getChannelType().name(),
                result,
                duration
            );
            
            return result;
            
        } catch (ExecutionException e) {
            // Check if the cause is a TimeoutException from TimeLimiter
            if (e.getCause() instanceof TimeoutException) {
                // Provider exceeded timeout
                Instant endTime = Instant.now();
                Duration duration = Duration.between(startTime, endTime);
                long durationMs = duration.toMillis();
                String traceId = MDC.get("traceId");
                
                log.warn("Provider timeout: provider={}, duration={}ms, challengeId={}, traceId={}", 
                    providerType, durationMs, challenge.getId(), traceId);
                
                // Record timeout metrics (Story 3.8)
                meterRegistry.counter("provider.timeout.total", 
                    "provider", providerType.name()
                ).increment();
                
                // Record timeout duration (Story 3.10 AC2)
                providerMetrics.recordTimeout(providerType.name(), duration);
                
                // Return timeout failure
                ProviderResult result = ProviderResult.timeout(
                    String.format("Provider timeout exceeded: %dms", durationMs)
                );
                
                // Record provider call metrics including timeout (Story 3.10 AC1, AC2)
                providerMetrics.recordProviderCall(
                    providerType.name(),
                    challenge.getChannelType().name(),
                    result,
                    duration
                );
                
                return result;
            }
            
            // Provider threw exception
            Instant endTime = Instant.now();
            Duration duration = Duration.between(startTime, endTime);
            long durationMs = duration.toMillis();
            
            log.error("Provider execution failed: provider={}, duration={}ms, challengeId={}", 
                providerType, durationMs, challenge.getId(), e.getCause());
            
            // Return failure (not a timeout)
            ProviderResult result = ProviderResult.failure(
                "PROVIDER_ERROR", 
                e.getCause() != null ? e.getCause().getMessage() : e.getMessage()
            );
            
            // Record provider call metrics (Story 3.10 AC1)
            providerMetrics.recordProviderCall(
                providerType.name(),
                challenge.getChannelType().name(),
                result,
                duration
            );
            
            return result;
            
        } catch (InterruptedException e) {
            // Thread interrupted
            Thread.currentThread().interrupt();
            
            Instant endTime = Instant.now();
            Duration duration = Duration.between(startTime, endTime);
            
            log.error("Provider call interrupted: provider={}, challengeId={}", 
                providerType, challenge.getId(), e);
            
            ProviderResult result = ProviderResult.failure("INTERRUPTED", "Provider call was interrupted");
            
            // Record provider call metrics (Story 3.10 AC1)
            providerMetrics.recordProviderCall(
                providerType.name(),
                challenge.getChannelType().name(),
                result,
                duration
            );
            
            return result;
        }
    }
    
    /**
     * Sends a challenge asynchronously (delegates to provider).
     * 
     * <p>This method is provided for backward compatibility but is not typically
     * used since {@link #sendChallenge(SignatureChallenge, String)} already handles
     * async execution with timeout decoration.
     * 
     * @param challenge the signature challenge to send
     * @param recipient the recipient identifier
     * @return CompletableFuture that completes with ProviderResult
     */
    @Override
    public CompletableFuture<ProviderResult> sendChallengeAsync(
            SignatureChallenge challenge, String recipient) {
        // This adapter's main method (sendChallenge) already handles async + timeout
        // This method delegates to the provider directly without decoration
        ProviderType providerType = challenge.getProvider();
        SignatureProviderPort provider = getProviderImplementation(providerType);
        return provider.sendChallengeAsync(challenge, recipient);
    }
    
    /**
     * Checks health status (delegates to provider).
     * 
     * @param providerType the provider type to check
     * @return HealthStatus from the actual provider
     */
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        SignatureProviderPort provider = getProviderImplementation(providerType);
        return provider.checkHealth(providerType);
    }
    
    /**
     * Selects the appropriate TimeLimiter instance based on provider type.
     * 
     * <p>Mapping:
     * <ul>
     * <li>SMS → smsTimeout</li>
     * <li>PUSH → pushTimeout</li>
     * <li>VOICE → voiceTimeout</li>
     * <li>BIOMETRIC → biometricTimeout</li>
     * </ul>
     * 
     * @param providerType the provider type
     * @return TimeLimiter instance name
     */
    private String getTimeLimiterName(ProviderType providerType) {
        return switch (providerType) {
            case SMS -> "smsTimeout";
            case PUSH -> "pushTimeout";
            case VOICE -> "voiceTimeout";
            case BIOMETRIC -> "biometricTimeout";
        };
    }
    
    /**
     * Gets the actual provider implementation from the provider map.
     * 
     * <p>Provider bean names:
     * <ul>
     * <li>SMS → twilioSmsProvider</li>
     * <li>PUSH → pushProvider</li>
     * <li>VOICE → voiceProvider</li>
     * <li>BIOMETRIC → biometricProvider</li>
     * </ul>
     * 
     * @param providerType the provider type
     * @return SignatureProviderPort implementation
     * @throws IllegalArgumentException if provider not found
     */
    private SignatureProviderPort getProviderImplementation(ProviderType providerType) {
        String beanName = switch (providerType) {
            case SMS -> "twilioSmsProvider";
            case PUSH -> "pushProvider";
            case VOICE -> "voiceProvider";
            case BIOMETRIC -> "biometricProvider";
        };
        
        SignatureProviderPort provider = providerMap.get(beanName);
        if (provider == null) {
            throw new IllegalArgumentException(
                "Provider not found for type: " + providerType + " (bean: " + beanName + ")"
            );
        }
        
        return provider;
    }
}


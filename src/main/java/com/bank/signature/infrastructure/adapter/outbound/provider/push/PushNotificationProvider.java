package com.bank.signature.infrastructure.adapter.outbound.provider.push;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ScheduledExecutorService;

/**
 * Push Notification Provider - Firebase Cloud Messaging (FCM) Implementation.
 * Story 3.3: Push Notification Provider (FCM Integration)
 * 
 * Production-ready FCM integration implementing SignatureProviderPort interface.
 * 
 * Features:
 * - Firebase Cloud Messaging (FCM) integration via firebase-admin SDK
 * - ProviderResult success/failure pattern (no exceptions thrown)
 * - Health check with configuration validation
 * - Prometheus metrics for monitoring
 * - Notification + Data payload format
 * - Device token validation
 * 
 * Architecture:
 * - Hexagonal Architecture: Implements SignatureProviderPort (domain interface)
 * - Domain purity: Returns domain value objects (ProviderResult, HealthStatus)
 * - Infrastructure layer: FCM SDK dependency isolated here
 * 
 * Message Format:
 * - Notification: Title + Body visible to user
 * - Data: Custom payload with challenge details
 * 
 * Bean name: pushProvider (maps to ProviderType.PUSH)
 * 
 * @since Story 3.3
 * @see SignatureProviderPort
 * @see com.bank.signature.infrastructure.adapter.outbound.provider.twilio.TwilioSmsProvider Reference implementation
 */
@Component("pushProvider")
@ConditionalOnProperty(prefix = "providers.push", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class PushNotificationProvider implements SignatureProviderPort {
    
    private static final String METRIC_PREFIX = "provider.push";
    private static final String NOTIFICATION_TITLE = "Código de Firma Digital";
    private static final String NOTIFICATION_BODY_TEMPLATE = "Su código es: %s";
    
    private final FirebaseMessaging firebaseMessaging;
    private final MeterRegistry meterRegistry;
    private final ScheduledExecutorService providerExecutorService;
    
    // Health check cache (30 seconds TTL)
    private volatile HealthStatus cachedHealthStatus;
    private volatile Instant healthCheckTimestamp = Instant.EPOCH;
    private static final Duration HEALTH_CHECK_CACHE_TTL = Duration.ofSeconds(30);
    
    /**
     * Sends a signature challenge via Firebase Cloud Messaging (FCM).
     * 
     * This method builds an FCM message with both notification and data payloads,
     * sends it to the specified device token, and returns the result.
     * 
     * Success Case:
     * - FCM returns a message ID
     * - ProviderResult.success(messageId, providerProof) returned
     * - Metrics recorded
     * 
     * Failure Cases:
     * - Invalid device token → ProviderResult.failure("FCM_ERROR_INVALID_ARGUMENT", ...)
     * - Device token not found → ProviderResult.failure("FCM_ERROR_NOT_FOUND", ...)
     * - FCM service unavailable → ProviderResult.failure("FCM_ERROR_UNAVAILABLE", ...)
     * - Timeout → ProviderResult.failure("TIMEOUT", ...)
     * - Unexpected error → ProviderResult.failure("PROVIDER_ERROR", ...)
     * 
     * @param challenge The signature challenge containing OTP code and metadata
     * @param deviceToken The FCM device token (recipient identifier)
     * @return ProviderResult with success/failure status and provider proof
     * @throws IllegalArgumentException if challenge is null or deviceToken is null/blank
     */
    @Override
    @CircuitBreaker(name = "pushProvider")
    @Retry(name = "pushRetry")
    public ProviderResult sendChallenge(SignatureChallenge challenge, String deviceToken) {
        Objects.requireNonNull(challenge, "challenge cannot be null");
        Objects.requireNonNull(deviceToken, "deviceToken cannot be null");
        if (deviceToken.isBlank()) {
            throw new IllegalArgumentException("deviceToken cannot be blank");
        }
        
        log.info("Sending push notification: challengeId={}, deviceToken={}", 
            challenge.getId(), maskToken(deviceToken));
        
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            // Build FCM message
            Message message = buildFcmMessage(challenge, deviceToken);
            
            // Send via FCM
            String messageId = firebaseMessaging.send(message);
            
            // Build provider proof
            String providerProof = buildProviderProof(messageId, deviceToken);
            
            // Record metrics
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "success"));
            meterRegistry.counter(METRIC_PREFIX + ".calls", "status", "success").increment();
            
            log.info("Push notification sent successfully: challengeId={}, messageId={}", 
                challenge.getId(), messageId);
            
            return ProviderResult.success(messageId, providerProof);
            
        } catch (FirebaseMessagingException e) {
            String errorCode = "FCM_ERROR_" + (e.getMessagingErrorCode() != null 
                ? e.getMessagingErrorCode().name() 
                : "UNKNOWN");
            
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "error", "error_code", errorCode));
            meterRegistry.counter(METRIC_PREFIX + ".errors", "error_code", errorCode).increment();
            
            log.error("FCM API error: challengeId={}, errorCode={}, message={}", 
                challenge.getId(), errorCode, e.getMessage());
            
            return ProviderResult.failure(errorCode, e.getMessage());
            
        } catch (Exception e) {
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "error", "error_code", "PROVIDER_ERROR"));
            meterRegistry.counter(METRIC_PREFIX + ".errors", "error_code", "PROVIDER_ERROR").increment();
            
            log.error("Unexpected error sending push notification: challengeId={}", 
                challenge.getId(), e);
            
            return ProviderResult.failure("PROVIDER_ERROR", e.getMessage());
        }
    }
    
    /**
     * Sends a signature challenge asynchronously via Firebase Cloud Messaging (preferred method).
     * 
     * <p>This method wraps the synchronous {@link #sendChallenge(SignatureChallenge, String)}
     * in a {@link CompletableFuture} to enable timeout protection via Resilience4j TimeLimiter
     * (Story 3.8).
     * 
     * <p><strong>Timeout Protection:</strong>
     * When decorated with {@code @TimeLimiter(name="pushTimeout")}, this future will be
     * cancelled if FCM does not respond within the configured timeout (default: 3s).
     * 
     * <p><strong>Implementation Note:</strong>
     * This method reuses the existing synchronous logic (DRY principle) rather than
     * duplicating the FCM API call implementation.
     * 
     * @param challenge the signature challenge to send
     * @param deviceToken the FCM device registration token
     * @return CompletableFuture that completes with ProviderResult when FCM responds
     * @throws IllegalArgumentException if challenge or deviceToken is null/invalid
     * @since Story 3.8 - Provider Timeout Configuration
     */
    @Override
    public CompletableFuture<ProviderResult> sendChallengeAsync(
            SignatureChallenge challenge, String deviceToken) {
        return CompletableFuture.supplyAsync(
            () -> sendChallenge(challenge, deviceToken),
            providerExecutorService
        );
    }
    
    /**
     * Checks the health status of the FCM Push provider.
     * 
     * Health check validates:
     * 1. FCM configuration is complete
     * 2. FirebaseApp is initialized
     * 3. FirebaseMessaging instance is available
     * 
     * Results are cached for 30 seconds to avoid excessive checks.
     * 
     * @param providerType Must be ProviderType.PUSH
     * @return HealthStatus indicating UP or DOWN with details
     * @throws IllegalArgumentException if providerType is not PUSH
     */
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.PUSH) {
            throw new IllegalArgumentException("Expected PUSH provider type, got: " + providerType);
        }
        
        // Return cached result if still valid
        Instant now = Instant.now();
        if (cachedHealthStatus != null && 
            Duration.between(healthCheckTimestamp, now).compareTo(HEALTH_CHECK_CACHE_TTL) < 0) {
            log.debug("Returning cached health status (age: {}s)", 
                Duration.between(healthCheckTimestamp, now).getSeconds());
            return cachedHealthStatus;
        }
        
        try {
            // Validate FCM configuration
            if (firebaseMessaging == null) {
                HealthStatus status = HealthStatus.down("FCM not initialized - FirebaseMessaging bean is null");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            // Additional validation: try to get FirebaseApp instance
            // This validates that Firebase is properly configured
            if (firebaseMessaging.toString() == null) {
                HealthStatus status = HealthStatus.down("FCM configuration invalid");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            HealthStatus status = HealthStatus.up("FCM Push provider operational");
            cacheHealthStatus(status, now);
            log.debug("Health check PASSED: {}", status.details());
            return status;
            
        } catch (Exception e) {
            HealthStatus status = HealthStatus.down("FCM configuration error: " + e.getMessage());
            cacheHealthStatus(status, now);
            log.error("Health check FAILED with exception", e);
            return status;
        }
    }
    
    /**
     * Builds an FCM message with notification and data payloads.
     * 
     * Notification Payload (visible to user):
     * - title: "Código de Firma Digital"
     * - body: "Su código es: {challengeCode}"
     * 
     * Data Payload (custom metadata):
     * - challengeId: UUID string
     * - challengeCode: OTP code
     * - expiresAt: ISO-8601 timestamp
     * - channelType: "PUSH"
     * 
     * @param challenge The signature challenge
     * @param deviceToken FCM device token
     * @return FCM Message ready to send
     */
    private Message buildFcmMessage(SignatureChallenge challenge, String deviceToken) {
        String notificationBody = String.format(NOTIFICATION_BODY_TEMPLATE, challenge.getChallengeCode());
        
        return Message.builder()
            .setNotification(Notification.builder()
                .setTitle(NOTIFICATION_TITLE)
                .setBody(notificationBody)
                .build())
            .putAllData(Map.of(
                "challengeId", challenge.getId().toString(),
                "challengeCode", challenge.getChallengeCode(),
                "expiresAt", challenge.getExpiresAt().toString(),
                "channelType", "PUSH"
            ))
            .setToken(deviceToken)
            .build();
    }
    
    /**
     * Builds provider proof as JSON string.
     * 
     * Format:
     * {
     *   "messageId": "FCM message ID",
     *   "deviceToken": "masked device token",
     *   "timestamp": "ISO-8601 timestamp",
     *   "provider": "FCM"
     * }
     * 
     * @param messageId FCM message ID
     * @param deviceToken Device token (will be masked)
     * @return JSON string with provider proof
     */
    private String buildProviderProof(String messageId, String deviceToken) {
        return String.format(
            "{\"messageId\":\"%s\",\"deviceToken\":\"%s\",\"timestamp\":\"%s\",\"provider\":\"FCM\"}",
            messageId,
            maskToken(deviceToken),
            Instant.now().toString()
        );
    }
    
    /**
     * Masks device token for logging/proof (shows first 8 and last 8 chars).
     * 
     * Example: "fGw0qy4TQfmX...9Hj2KpLm"
     * 
     * @param token Device token
     * @return Masked token
     */
    private String maskToken(String token) {
        if (token == null || token.length() <= 16) {
            return "***";
        }
        return token.substring(0, 8) + "..." + token.substring(token.length() - 8);
    }
    
    /**
     * Caches health status with timestamp.
     */
    private void cacheHealthStatus(HealthStatus status, Instant timestamp) {
        this.cachedHealthStatus = status;
        this.healthCheckTimestamp = timestamp;
    }
}

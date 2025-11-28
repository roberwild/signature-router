package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;

import java.util.concurrent.CompletableFuture;

/**
 * Outbound port for signature challenge delivery via external providers.
 * 
 * <p>This interface defines the abstraction between the domain layer and infrastructure
 * providers (SMS, Push, Voice, Biometric), following hexagonal architecture principles.
 * 
 * <p><strong>Domain Purity:</strong>
 * This interface has ZERO dependencies on infrastructure libraries (Twilio, FCM, HTTP clients).
 * It only depends on domain models and Java standard library.
 * 
 * <p><strong>Implementation Examples:</strong>
 * <ul>
 * <li>TwilioSmsProvider - Sends SMS via Twilio API (Story 3.2)</li>
 * <li>FcmPushProvider - Sends push notifications via Firebase Cloud Messaging (Story 3.3)</li>
 * <li>TwilioVoiceProvider - Sends voice calls via Twilio Voice API (Story 3.4)</li>
 * <li>BiometricSdkProvider - Triggers biometric authentication (Story 3.5)</li>
 * </ul>
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // In application service
 * SignatureProviderPort provider = providerFactory.getProvider(ProviderType.SMS);
 * 
 * // Send challenge
 * ProviderResult result = provider.sendChallenge(challenge);
 * if (result.success()) {
 *     String messageId = result.providerChallengeId();
 *     challenge.markAsSent(messageId, result.providerProof());
 * } else {
 *     log.error("Provider failed: {} - {}", result.errorCode(), result.errorMessage());
 *     throw new ProviderException(result.errorCode(), result.errorMessage());
 * }
 * 
 * // Health check
 * HealthStatus health = provider.checkHealth(ProviderType.SMS);
 * if (!health.isHealthy()) {
 *     log.warn("Provider unhealthy: {}", health.details());
 * }
 * }</pre>
 * 
 * @since Story 3.1 - Provider Abstraction Interface
 */
public interface SignatureProviderPort {
    
    /**
     * Sends a signature challenge to the user via the provider's channel (synchronous).
     * 
     * <p>This method abstracts the entire provider interaction:
     * <ol>
     * <li>Authenticate with provider (API key, token, etc.)</li>
     * <li>Format the challenge message according to provider requirements</li>
     * <li>Send challenge via provider's API (SMS, Push, Voice call, etc.)</li>
     * <li>Receive confirmation from provider</li>
     * <li>Return result with provider proof or error details</li>
     * </ol>
     * 
     * <p><strong>Success Scenario:</strong>
     * If the provider successfully accepts the challenge, returns a {@link ProviderResult}
     * with {@code success=true}, containing the provider's challenge ID and full JSON proof.
     * 
     * <p><strong>Failure Scenario:</strong>
     * If the provider rejects the challenge or times out, returns a {@link ProviderResult}
     * with {@code success=false}, containing an error code and human-readable message.
     * 
     * <p><strong>Error Codes (examples):</strong>
     * <ul>
     * <li>TIMEOUT - Provider did not respond within configured timeout</li>
     * <li>INVALID_PHONE - Phone number format invalid</li>
     * <li>PROVIDER_ERROR - Provider returned error response</li>
     * <li>AUTHENTICATION_FAILED - API credentials invalid</li>
     * <li>RATE_LIMIT_EXCEEDED - Provider rate limit hit</li>
     * </ul>
     * 
     * <p><strong>Note:</strong> For new code, prefer {@link #sendChallengeAsync(SignatureChallenge, String)}
     * which enables timeout protection via Resilience4j TimeLimiter (Story 3.8).
     * 
     * @param challenge the signature challenge to send (contains challenge code, channel type)
     * @param recipient the recipient identifier (phone number for SMS/Voice, device token for Push, biometric ID for Biometric)
     * @return ProviderResult indicating success/failure with provider details or error information
     * @throws IllegalArgumentException if challenge or recipient is null or invalid
     */
    ProviderResult sendChallenge(SignatureChallenge challenge, String recipient);
    
    /**
     * Sends a signature challenge to the user asynchronously (preferred method).
     * 
     * <p>This method returns a {@link CompletableFuture} that enables timeout protection
     * via Resilience4j TimeLimiter. When decorated with {@code @TimeLimiter}, the future
     * will be cancelled if the provider does not respond within the configured timeout.
     * 
     * <p><strong>Implementation Pattern:</strong>
     * Providers should wrap their synchronous {@link #sendChallenge(SignatureChallenge, String)}
     * method in a {@code CompletableFuture.supplyAsync()} using the injected
     * {@code ScheduledExecutorService}:
     * 
     * <pre>{@code
     * @Override
     * public CompletableFuture<ProviderResult> sendChallengeAsync(
     *     SignatureChallenge challenge, String recipient) {
     *     return CompletableFuture.supplyAsync(
     *         () -> sendChallenge(challenge, recipient),
     *         providerExecutorService
     *     );
     * }
     * }</pre>
     * 
     * <p><strong>Timeout Behavior:</strong>
     * When this future is decorated with Resilience4j TimeLimiter (Story 3.8):
     * <ul>
     * <li>If provider responds within timeout → Future completes normally</li>
     * <li>If provider exceeds timeout → Future is cancelled (cancelRunningFuture=true)</li>
     * <li>If provider throws exception → Future completes exceptionally</li>
     * </ul>
     * 
     * <p><strong>Thread Safety:</strong>
     * This method MUST be thread-safe as it may be called concurrently from
     * multiple request threads.
     * 
     * @param challenge the signature challenge to send (contains challenge code, channel type)
     * @param recipient the recipient identifier (phone number for SMS/Voice, device token for Push, biometric ID for Biometric)
     * @return CompletableFuture that completes with ProviderResult when provider responds
     * @throws IllegalArgumentException if challenge or recipient is null or invalid
     * @since Story 3.8 - Provider Timeout Configuration
     */
    CompletableFuture<ProviderResult> sendChallengeAsync(SignatureChallenge challenge, String recipient);
    
    /**
     * Checks the health status of a specific provider type.
     * 
     * <p>This method performs a lightweight health check to determine if the provider
     * is operational and accepting requests. Typical checks include:
     * <ul>
     * <li>Network connectivity to provider API</li>
     * <li>Authentication credential validity</li>
     * <li>Provider service availability</li>
     * <li>Response time within acceptable threshold</li>
     * </ul>
     * 
     * <p><strong>Implementation Note:</strong>
     * Health checks should be fast (< 1s) and may use cached results to avoid
     * overwhelming provider APIs. Circuit breakers (Epic 4) will integrate with
     * this method to manage degraded providers.
     * 
     * @param providerType the type of provider to check (SMS, PUSH, VOICE, BIOMETRIC)
     * @return HealthStatus indicating if provider is UP or DOWN with details
     * @throws IllegalArgumentException if providerType is null
     */
    HealthStatus checkHealth(ProviderType providerType);
}


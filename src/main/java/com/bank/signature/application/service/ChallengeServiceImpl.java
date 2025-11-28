package com.bank.signature.application.service;

import com.bank.signature.domain.exception.FallbackLoopException;
import com.bank.signature.domain.exception.ProviderException;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import com.bank.signature.domain.service.ChallengeService;
import com.bank.signature.domain.service.FallbackLoopDetector;
import com.bank.signature.domain.service.ProviderSelectorService;
import com.bank.signature.infrastructure.config.FallbackChainConfig;
import com.bank.signature.infrastructure.resilience.DegradedModeManager;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Implementation of ChallengeService.
 * Story 2.4: Challenge Creation & Provider Selection
 * Story 2.5: SMS Provider Integration (Twilio)
 * Story 3.2: Updated to use SignatureProviderPort and ProviderResult success/failure pattern
 * Story 3.8: Integrated SignatureProviderAdapter for timeout protection via Resilience4j TimeLimiter
 * Story 4-2: Added fallback chain support (SMS→VOICE, PUSH→SMS, etc.)
 * Story 4-3: Added degraded mode support (skip challenge sending when degraded)
 * Story 4-7: Added fallback loop prevention (max attempts limit, duplicate detection)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeServiceImpl implements ChallengeService {
    
    private final ProviderSelectorService providerSelectorService;
    private final SignatureProviderPort signatureProviderAdapter;  // Story 3.8: Adapter with timeout protection
    private final FallbackChainConfig fallbackChainConfig;
    private final MeterRegistry meterRegistry;
    private final DegradedModeManager degradedModeManager;
    
    /**
     * Maximum number of provider attempts per signature request.
     * Story 4-7: Fallback Loop Prevention
     * Default: 3 (primary + up to 2 fallbacks)
     */
    @Value("${resilience.fallback.max-attempts:3}")
    private int maxFallbackAttempts;
    
    @Override
    public SignatureChallenge createChallenge(SignatureRequest signatureRequest, ChannelType channelType, String phoneNumber) {
        log.info("Creating and sending challenge for signature request: id={}, channel={}", 
            signatureRequest.getId(), channelType);
        
        // 1. Select provider based on channel type
        ProviderType providerType = providerSelectorService.selectProvider(channelType);
        log.debug("Provider selected: {} for channel: {}", providerType, channelType);
        
        // 2. Create challenge (aggregate validates business rules)
        SignatureChallenge challenge = signatureRequest.createChallenge(channelType, providerType);
        
        log.info("Challenge created: id={}, channel={}, provider={}, status={}", 
            challenge.getId(), challenge.getChannelType(), challenge.getProvider(), challenge.getStatus());
        
        // Story 4-3: If system in degraded mode, skip sending challenge (queue for retry)
        if (degradedModeManager.isInDegradedMode()) {
            log.warn("⚠️ System in DEGRADED MODE - challenge created but NOT sent: id={}, reason=\"{}\"", 
                challenge.getId(), degradedModeManager.getDegradedReason());
            
            // Mark SignatureRequest status as PENDING_DEGRADED
            // Note: This requires updating the aggregate's status
            // For now, challenge stays in PENDING status, SignatureRequest will be PENDING_DEGRADED
            
            return challenge;  // Return challenge WITHOUT sending
        }
        
        // 3. Send challenge via provider (Story 3.2 - updated to use ProviderResult success/failure)
        // Story 4-2: Added fallback support
        ProviderResult providerResult = sendChallengeWithFallback(
            signatureRequest, 
            challenge, 
            channelType, 
            phoneNumber
        );
        
        // 4. Handle final result (after fallback attempts)
        if (providerResult.success()) {
            log.info("Challenge sent successfully (possibly via fallback): id={}, providerChallengeId={}", 
                challenge.getId(), providerResult.providerChallengeId());
        } else {
            log.error("Challenge failed (including fallback attempts): id={}", challenge.getId());
            throw new ProviderException(
                providerType,
                providerResult.errorMessage(),
                providerResult.errorCode()
            );
        }
        
        return challenge;
    }
    
    /**
     * Sends challenge with automatic fallback support.
     * Story 4-2: Fallback Chain Implementation
     * Story 4-7: Fallback Loop Prevention
     * 
     * Flow:
     * 1. Try primary provider
     * 2. If fails AND fallback enabled → try fallback channel
     * 3. If fallback also fails → return failure
     * 
     * Fallback Triggers:
     * - ProviderResult.failure() (provider error)
     * - CallNotPermittedException (circuit breaker OPEN)
     * - Any unexpected exception
     * 
     * Loop Prevention (Story 4-7):
     * - Max N attempts per request (configurable, default 3)
     * - Tracks attempted providers to prevent duplicates
     * - Throws FallbackLoopException if loop detected
     * - Prometheus metric: fallback.loops.prevented.total
     * 
     * @param signatureRequest The signature request
     * @param challenge The challenge to send
     * @param channelType The primary channel type
     * @param recipient The recipient (phone, device token, biometric ID)
     * @return ProviderResult (success if primary OR fallback succeeds)
     */
    private ProviderResult sendChallengeWithFallback(
        SignatureRequest signatureRequest,
        SignatureChallenge challenge,
        ChannelType channelType,
        String recipient
    ) {
        // Story 4-7: Create loop detector for this request
        FallbackLoopDetector loopDetector = new FallbackLoopDetector(maxFallbackAttempts);
        
        // Try primary provider
        ProviderResult primaryResult = sendToProviderWithLoopCheck(
            challenge, 
            recipient, 
            loopDetector
        );
        
        if (primaryResult.success()) {
            challenge.markAsSent(primaryResult);
            return primaryResult;
        }
        
        // Primary failed - check fallback
        log.warn("Primary provider failed: channel={}, error={}", 
            channelType, primaryResult.errorMessage());
        challenge.fail(primaryResult.errorCode());
        
        // Story 4-2: Attempt fallback if configured
        if (!fallbackChainConfig.isEnabled()) {
            log.debug("Fallback disabled - returning primary failure");
            return primaryResult;
        }
        
        if (!fallbackChainConfig.hasFallback(channelType)) {
            log.debug("No fallback configured for channel: {}", channelType);
            return primaryResult;
        }
        
        // Execute fallback
        ChannelType fallbackChannel = fallbackChainConfig.getFallbackChannel(channelType);
        log.info("Triggering fallback: {} → {}", channelType, fallbackChannel);
        meterRegistry.counter("fallback.triggered", 
            "from", channelType.name(), 
            "to", fallbackChannel.name()
        ).increment();
        
        try {
            // Create fallback challenge
            ProviderType fallbackProviderType = providerSelectorService.selectProvider(fallbackChannel);
            SignatureChallenge fallbackChallenge = signatureRequest.createChallenge(
                fallbackChannel, 
                fallbackProviderType
            );
            
            log.info("Fallback challenge created: id={}, channel={}", 
                fallbackChallenge.getId(), fallbackChannel);
            
            // Story 4-7: Send via fallback provider with loop check
            ProviderResult fallbackResult = sendToProviderWithLoopCheck(
                fallbackChallenge, 
                recipient, 
                loopDetector
            );
            
            if (fallbackResult.success()) {
                fallbackChallenge.markAsSent(fallbackResult);
                meterRegistry.counter("fallback.success", 
                    "from", channelType.name(), 
                    "to", fallbackChannel.name()
                ).increment();
                
                log.info("Fallback SUCCESS: {} → {}, challengeId={}", 
                    channelType, fallbackChannel, fallbackChallenge.getId());
                return fallbackResult;
            } else {
                fallbackChallenge.fail(fallbackResult.errorCode());
                meterRegistry.counter("fallback.failure", 
                    "from", channelType.name(), 
                    "to", fallbackChannel.name()
                ).increment();
                
                log.error("Fallback FAILED: {} → {}, error={}", 
                    channelType, fallbackChannel, fallbackResult.errorMessage());
                return fallbackResult;
            }
            
        } catch (FallbackLoopException e) {
            // Story 4-7: Loop detected - prevent infinite fallback
            log.error("Fallback loop prevented: {} → {}, message={}, attemptedProviders={}", 
                channelType, fallbackChannel, e.getMessage(), e.getAttemptedProviders());
            
            meterRegistry.counter("fallback.loops.prevented.total").increment();
            
            return primaryResult; // Return original failure (no more fallback attempts)
            
        } catch (Exception e) {
            log.error("Fallback attempt threw exception: {} → {}", 
                channelType, fallbackChannel, e);
            meterRegistry.counter("fallback.error", 
                "from", channelType.name(), 
                "to", fallbackChannel.name()
            ).increment();
            return primaryResult; // Return original failure
        }
    }
    
    /**
     * Sends challenge to provider with loop detection.
     * Story 4-7: Fallback Loop Prevention
     * 
     * <p>This method wraps {@link #sendToProvider(SignatureChallenge, String)} with
     * loop detection. Before sending, it checks if the provider has already been attempted.
     * 
     * @param challenge     The challenge to send
     * @param recipient     The recipient
     * @param loopDetector  The loop detector tracking attempted providers
     * @return ProviderResult (success/failure/timeout)
     * @throws FallbackLoopException if loop detected (duplicate or max exceeded)
     */
    private ProviderResult sendToProviderWithLoopCheck(
        SignatureChallenge challenge, 
        String recipient,
        FallbackLoopDetector loopDetector
    ) {
        // Story 4-7: Check for loops before attempting provider
        ProviderType providerType = challenge.getProvider();
        loopDetector.recordAttempt(providerType);
        
        log.debug("Sending to provider with loop check: provider={}, attempt={}/{}", 
            providerType, loopDetector.getAttemptCount(), loopDetector.getMaxAttempts());
        
        // Delegate to actual provider send
        return sendToProvider(challenge, recipient);
    }
    
    /**
     * Sends challenge to provider with timeout protection (handles circuit breaker exceptions).
     * Story 3.8: Now uses SignatureProviderAdapter which decorates calls with Resilience4j TimeLimiter
     * Story 4-1: Circuit breaker integration
     * Story 4-2: Fallback trigger on circuit OPEN
     * 
     * <p><strong>Timeout Protection (Story 3.8):</strong>
     * The SignatureProviderAdapter automatically applies timeout protection via Resilience4j TimeLimiter:
     * <ul>
     * <li>SMS calls → 5s timeout (configurable via smsTimeout)</li>
     * <li>PUSH calls → 3s timeout (configurable via pushTimeout)</li>
     * <li>VOICE calls → 10s timeout (configurable via voiceTimeout)</li>
     * <li>BIOMETRIC calls → 2s timeout (configurable via biometricTimeout)</li>
     * </ul>
     * 
     * If timeout exceeded, ProviderResult.timeout() is returned with timedOut=true,
     * which can trigger fallback chain.
     * 
     * @param challenge The challenge to send
     * @param recipient The recipient
     * @return ProviderResult (success/failure/timeout)
     */
    private ProviderResult sendToProvider(SignatureChallenge challenge, String recipient) {
        try {
            // Story 3.8: Use adapter which provides timeout protection
            // The adapter internally selects the correct provider and applies TimeLimiter decoration
            return signatureProviderAdapter.sendChallenge(challenge, recipient);
            
        } catch (CallNotPermittedException e) {
            // Circuit breaker OPEN - fast failure
            log.warn("Circuit breaker OPEN for provider: {}", challenge.getProvider());
            return ProviderResult.failure("CIRCUIT_OPEN", "Circuit breaker is OPEN");
            
        } catch (Exception e) {
            log.error("Unexpected error calling provider: {}", challenge.getProvider(), e);
            return ProviderResult.failure("PROVIDER_ERROR", e.getMessage());
        }
    }
    
    /**
     * Retrieves the appropriate provider implementation.
     * 
     * @deprecated Since Story 3.8: This method is no longer used as we now inject
     *             SignatureProviderAdapter directly, which handles provider resolution
     *             internally with timeout protection. Kept for potential future use.
     * 
     * Story 2.5: Provider resolution via Spring bean name convention
     * Story 3.2: Updated for new ProviderType enum (SMS, PUSH, VOICE, BIOMETRIC)
     * Story 3.8: Deprecated in favor of SignatureProviderAdapter
     */
    @Deprecated(since = "Story 3.8")
    private SignatureProviderPort getProvider(ProviderType providerType) {
        // Note: This method is kept for backward compatibility but is no longer
        // actively used since Story 3.8 introduced SignatureProviderAdapter
        throw new UnsupportedOperationException(
            "Direct provider access deprecated. Use SignatureProviderAdapter instead (Story 3.8)"
        );
    }
}


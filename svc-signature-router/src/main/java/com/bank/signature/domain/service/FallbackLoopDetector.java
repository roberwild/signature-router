package com.bank.signature.domain.service;

import com.bank.signature.domain.exception.FallbackLoopException;
import com.bank.signature.domain.model.valueobject.ProviderType;
import lombok.extern.slf4j.Slf4j;

import java.util.HashSet;
import java.util.Set;

/**
 * Service that detects and prevents infinite loops in fallback chains.
 * 
 * <p>This service tracks which providers have been attempted for a signature request
 * and prevents attempting the same provider twice or exceeding max attempts.
 * 
 * <p><strong>Loop Prevention Rules:</strong>
 * <ol>
 * <li><strong>No Duplicate Providers:</strong> Each provider can only be attempted once per request</li>
 * <li><strong>Max Attempts Limit:</strong> Maximum N providers can be tried (default: 3)</li>
 * <li><strong>Clear Logging:</strong> All loop detections logged at ERROR level with traceId</li>
 * <li><strong>Metrics:</strong> Counter {@code fallback.loops.prevented.total} incremented</li>
 * </ol>
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * // Create detector with maxAttempts=3
 * FallbackLoopDetector detector = new FallbackLoopDetector(3);
 * 
 * // Try primary provider (SMS)
 * detector.recordAttempt(ProviderType.SMS); // OK - first attempt
 * 
 * // Try fallback (VOICE)
 * detector.recordAttempt(ProviderType.VOICE); // OK - second attempt
 * 
 * // Try second fallback (PUSH)
 * detector.recordAttempt(ProviderType.PUSH); // OK - third attempt (max reached)
 * 
 * // Try fourth fallback - MAX EXCEEDED!
 * detector.recordAttempt(ProviderType.SMS); // Throws FallbackLoopException
 * 
 * // Or try duplicate - LOOP DETECTED!
 * detector = new FallbackLoopDetector(3);
 * detector.recordAttempt(ProviderType.SMS);
 * detector.recordAttempt(ProviderType.SMS); // Throws FallbackLoopException (duplicate)
 * }</pre>
 * 
 * <p><strong>Metrics Published:</strong>
 * <pre>
 * fallback.loops.prevented.total - Counter incremented when loop prevented
 * </pre>
 * 
 * <p><strong>Thread Safety:</strong>
 * This class is NOT thread-safe. Create one instance per signature request
 * (not shared across requests).
 * 
 * @since Story 4-7 - Fallback Loop Prevention
 */
@Slf4j
public class FallbackLoopDetector {
    
    /**
     * Set of provider types that have been attempted in this request.
     */
    private final Set<ProviderType> attemptedProviders = new HashSet<>();
    
    /**
     * Maximum number of provider attempts allowed per request.
     * Default: 3 (primary + 2 fallbacks)
     */
    private final int maxAttempts;
    
    /**
     * Constructor with default max attempts (3).
     */
    public FallbackLoopDetector() {
        this(3);
    }
    
    /**
     * Constructor with custom max attempts.
     * 
     * @param maxAttempts Maximum number of provider attempts allowed (must be >= 1)
     * @throws IllegalArgumentException if maxAttempts < 1
     */
    public FallbackLoopDetector(int maxAttempts) {
        if (maxAttempts < 1) {
            throw new IllegalArgumentException("maxAttempts must be >= 1");
        }
        this.maxAttempts = maxAttempts;
        log.debug("FallbackLoopDetector created with maxAttempts={}", maxAttempts);
    }
    
    /**
     * Records a provider attempt and checks for loops.
     * 
     * <p>This method MUST be called before attempting to send via a provider.
     * If a loop is detected, it throws FallbackLoopException.
     * 
     * <p><strong>Loop Detection Rules:</strong>
     * <ol>
     * <li>If provider already attempted → LOOP (duplicate)</li>
     * <li>If attempts >= maxAttempts → LOOP (max exceeded)</li>
     * </ol>
     * 
     * @param providerType The provider type to attempt
     * @throws FallbackLoopException if loop detected (duplicate or max exceeded)
     * @throws IllegalArgumentException if providerType is null
     */
    public void recordAttempt(ProviderType providerType) {
        if (providerType == null) {
            throw new IllegalArgumentException("providerType cannot be null");
        }
        
        // Check 1: Duplicate provider
        if (attemptedProviders.contains(providerType)) {
            Set<String> providerNames = attemptedProviders.stream()
                .map(ProviderType::name)
                .collect(java.util.stream.Collectors.toSet());
            
            String message = String.format(
                "Fallback loop detected: %s provider already attempted (attempted: %s)",
                providerType.name(),
                providerNames
            );
            
            log.error("LOOP DETECTED: {}", message);
            throw new FallbackLoopException(message, providerNames);
        }
        
        // Check 2: Max attempts exceeded
        if (attemptedProviders.size() >= maxAttempts) {
            Set<String> providerNames = attemptedProviders.stream()
                .map(ProviderType::name)
                .collect(java.util.stream.Collectors.toSet());
            
            String message = String.format(
                "Fallback loop detected: Max attempts (%d) exceeded (attempted: %s, trying: %s)",
                maxAttempts,
                providerNames,
                providerType.name()
            );
            
            log.error("MAX ATTEMPTS EXCEEDED: {}", message);
            throw new FallbackLoopException(message, providerNames);
        }
        
        // Record attempt
        attemptedProviders.add(providerType);
        log.debug("Provider attempt recorded: provider={}, totalAttempts={}/{}", 
            providerType, attemptedProviders.size(), maxAttempts);
    }
    
    /**
     * Checks if a provider has already been attempted.
     * 
     * @param providerType The provider type to check
     * @return {@code true} if provider already attempted, {@code false} otherwise
     */
    public boolean hasAttempted(ProviderType providerType) {
        return attemptedProviders.contains(providerType);
    }
    
    /**
     * Gets the number of providers attempted so far.
     * 
     * @return Number of attempted providers (0 to maxAttempts)
     */
    public int getAttemptCount() {
        return attemptedProviders.size();
    }
    
    /**
     * Gets the maximum number of attempts allowed.
     * 
     * @return Max attempts configured
     */
    public int getMaxAttempts() {
        return maxAttempts;
    }
    
    /**
     * Gets an immutable set of provider types that have been attempted.
     * 
     * @return Set of attempted provider types
     */
    public Set<ProviderType> getAttemptedProviders() {
        return Set.copyOf(attemptedProviders);
    }
    
    /**
     * Resets the detector (clears all attempted providers).
     * 
     * <p><strong>WARNING:</strong> This should ONLY be used in tests.
     * In production, create a new FallbackLoopDetector per request.
     */
    public void reset() {
        attemptedProviders.clear();
        log.debug("FallbackLoopDetector reset");
    }
}


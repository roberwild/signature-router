package com.singularbank.signature.routing.domain.exception;

import java.util.Set;

/**
 * Exception thrown when a fallback loop is detected.
 * 
 * <p>This prevents infinite loops in fallback chains when a provider has already
 * been attempted in the current request. For example:
 * <ul>
 * <li>SMS fails → VOICE fallback → VOICE fails → tries SMS again (LOOP!)</li>
 * <li>Attempting same provider type twice in one request</li>
 * <li>Exceeding maximum fallback attempts (configurable, default 3)</li>
 * </ul>
 * 
 * <p><strong>Loop Prevention Strategy:</strong>
 * <ol>
 * <li>Track attempted provider types per signature request</li>
 * <li>Before fallback, check if provider already attempted</li>
 * <li>Enforce max attempts limit (default: 3 providers max)</li>
 * <li>Throw this exception if loop detected</li>
 * </ol>
 * 
 * <p><strong>Example:</strong>
 * <pre>{@code
 * Set<ProviderType> attemptedProviders = Set.of(SMS, VOICE);
 * throw new FallbackLoopException(
 *     "Fallback loop detected: SMS provider already attempted",
 *     attemptedProviders
 * );
 * }</pre>
 * 
 * @since Story 4-7 - Fallback Loop Prevention
 */
public class FallbackLoopException extends DomainException {
    
    private static final String ERROR_CODE = "FALLBACK_LOOP_DETECTED";
    
    /**
     * Set of provider types that have been attempted in this request.
     * Useful for debugging and logging.
     */
    private final Set<String> attemptedProviders;
    
    /**
     * Constructor with message and attempted providers.
     * 
     * @param message           Error message describing the loop
     * @param attemptedProviders Set of provider types already attempted
     */
    public FallbackLoopException(String message, Set<String> attemptedProviders) {
        super(message, ERROR_CODE);
        this.attemptedProviders = attemptedProviders;
    }
    
    /**
     * Gets the set of provider types that were attempted before the loop was detected.
     * 
     * @return Set of provider type names (e.g., ["SMS", "VOICE", "PUSH"])
     */
    public Set<String> getAttemptedProviders() {
        return attemptedProviders;
    }
}


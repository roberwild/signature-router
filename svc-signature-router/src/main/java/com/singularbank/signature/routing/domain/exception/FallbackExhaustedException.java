package com.singularbank.signature.routing.domain.exception;

/**
 * Exception thrown when all fallback channels have been exhausted.
 * 
 * @since Story 1.5
 */
public class FallbackExhaustedException extends DomainException {
    
    private static final String ERROR_CODE = "FALLBACK_EXHAUSTED";
    
    /**
     * Constructor with message.
     * 
     * @param message Error message
     */
    public FallbackExhaustedException(String message) {
        super(message, ERROR_CODE);
    }
}







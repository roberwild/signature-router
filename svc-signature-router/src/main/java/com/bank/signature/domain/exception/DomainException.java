package com.bank.signature.domain.exception;

/**
 * Base exception for all domain-specific exceptions.
 * 
 * <p><b>Design:</b> RuntimeException to avoid checked exception pollution in domain layer.</p>
 * 
 * @since Story 1.5
 */
public abstract class DomainException extends RuntimeException {
    
    private final String errorCode;
    
    /**
     * Constructor with message and error code.
     * 
     * @param message Human-readable error message
     * @param errorCode Machine-readable error code (e.g., "FALLBACK_EXHAUSTED")
     */
    protected DomainException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    /**
     * Constructor with message, error code, and cause.
     * 
     * @param message Human-readable error message
     * @param errorCode Machine-readable error code
     * @param cause The cause throwable
     */
    protected DomainException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    /**
     * Get machine-readable error code.
     * 
     * @return Error code (e.g., "FALLBACK_EXHAUSTED", "INVALID_STATE_TRANSITION")
     */
    public String getErrorCode() {
        return errorCode;
    }
}



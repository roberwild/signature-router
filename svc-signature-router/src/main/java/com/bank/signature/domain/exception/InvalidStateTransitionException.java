package com.bank.signature.domain.exception;

import com.bank.signature.domain.model.valueobject.SignatureStatus;

/**
 * Exception thrown when an invalid state transition is attempted.
 * 
 * @since Story 1.5
 */
public class InvalidStateTransitionException extends DomainException {
    
    private static final String ERROR_CODE = "INVALID_STATE_TRANSITION";
    
    private final SignatureStatus from;
    private final SignatureStatus to;
    
    /**
     * Constructor with state transition details.
     * 
     * @param message Error message
     * @param from Source status
     * @param to Target status
     */
    public InvalidStateTransitionException(String message, SignatureStatus from, SignatureStatus to) {
        super(String.format("%s (from %s to %s)", message, from, to), ERROR_CODE);
        this.from = from;
        this.to = to;
    }
    
    public SignatureStatus getFrom() {
        return from;
    }
    
    public SignatureStatus getTo() {
        return to;
    }
}







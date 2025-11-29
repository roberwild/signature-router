package com.bank.signature.domain.exception;

/**
 * Exception thrown when a SpEL expression is invalid.
 * Story 2.2: Routing Rules - CRUD API
 */
public class InvalidSpelExpressionException extends DomainException {
    
    private final int errorPosition;
    
    public InvalidSpelExpressionException(String message, int errorPosition) {
        super(message, "INVALID_SPEL_EXPRESSION");
        this.errorPosition = errorPosition;
    }
    
    public InvalidSpelExpressionException(String message, int errorPosition, Throwable cause) {
        super(message, "INVALID_SPEL_EXPRESSION", cause);
        this.errorPosition = errorPosition;
    }
    
    public int getErrorPosition() {
        return errorPosition;
    }
}


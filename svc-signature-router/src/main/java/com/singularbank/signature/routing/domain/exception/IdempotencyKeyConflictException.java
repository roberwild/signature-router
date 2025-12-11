package com.singularbank.signature.routing.domain.exception;

/**
 * Exception thrown when an idempotency key is reused with a different request body.
 * 
 * <p>This indicates a conflict: the same idempotency key was used for two different requests.
 * The client should use a different idempotency key for different requests.</p>
 * 
 * @since Story 10.5
 */
public class IdempotencyKeyConflictException extends DomainException {
    
    private static final String ERROR_CODE = "IDEMPOTENCY_KEY_CONFLICT";
    
    public IdempotencyKeyConflictException(String idempotencyKey) {
        super(
            String.format("Idempotency key '%s' was reused with a different request body", idempotencyKey),
            ERROR_CODE
        );
    }
    
    public IdempotencyKeyConflictException(String idempotencyKey, String message) {
        super(message, ERROR_CODE);
    }
}


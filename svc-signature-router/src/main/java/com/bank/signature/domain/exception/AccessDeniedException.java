package com.bank.signature.domain.exception;

/**
 * Exception thrown when a user attempts to access a resource they don't own.
 * Story 8.3: Pseudonymization Service - Customer-level RBAC
 * 
 * <p>This exception is thrown when:</p>
 * <ul>
 *   <li>A USER attempts to access another customer's signature request</li>
 *   <li>Customer ID claim is missing from JWT token</li>
 *   <li>Ownership validation fails (pseudonymized IDs don't match)</li>
 * </ul>
 * 
 * <p><b>HTTP Status:</b> 403 Forbidden</p>
 * 
 * <p><b>GDPR Compliance:</b></p>
 * <ul>
 *   <li>Art. 5(1)(f): Ensures data integrity and confidentiality</li>
 *   <li>Art. 32: Implements security of processing through access control</li>
 * </ul>
 * 
 * @since Story 8.3
 */
public class AccessDeniedException extends RuntimeException {
    
    /**
     * Constructs a new access denied exception with the specified detail message.
     *
     * @param message the detail message
     */
    public AccessDeniedException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new access denied exception with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause of the exception
     */
    public AccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }
}


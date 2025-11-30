package com.bank.signature.domain.exception;

/**
 * Exception thrown when pseudonymization operations fail.
 * Story 8.3: Pseudonymization Service
 * 
 * <p>This exception is thrown when:
 * <ul>
 *   <li>HMAC-SHA256 algorithm is not available</li>
 *   <li>Vault secret key cannot be retrieved</li>
 *   <li>Encryption/hashing fails for any reason</li>
 * </ul>
 * 
 * @since Story 8.3
 */
public class PseudonymizationException extends RuntimeException {
    
    /**
     * Constructs a new pseudonymization exception with the specified detail message.
     *
     * @param message the detail message
     */
    public PseudonymizationException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new pseudonymization exception with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause of the exception
     */
    public PseudonymizationException(String message, Throwable cause) {
        super(message, cause);
    }
}


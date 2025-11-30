package com.bank.signature.domain.exception;

/**
 * Exception thrown when secret rotation fails.
 * Story 8.5: Vault Secret Rotation
 * 
 * <p>This exception is thrown when:</p>
 * <ul>
 *   <li>Vault is unreachable during rotation</li>
 *   <li>New secret generation fails</li>
 *   <li>Application context refresh fails after rotation</li>
 *   <li>Rollback of failed rotation fails</li>
 * </ul>
 * 
 * @since Story 8.5
 */
public class SecretRotationException extends DomainException {
    
    public SecretRotationException(String message) {
        super(message);
    }
    
    public SecretRotationException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public SecretRotationException(String message, String errorCode, String userMessage) {
        super(message, errorCode, userMessage);
    }
}


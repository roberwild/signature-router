package com.singularbank.signature.routing.domain.exception;

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
    
    private static final String DEFAULT_ERROR_CODE = "SECRET_ROTATION_FAILED";
    
    public SecretRotationException(String message) {
        super(message, DEFAULT_ERROR_CODE);
    }
    
    public SecretRotationException(String message, Throwable cause) {
        super(message, DEFAULT_ERROR_CODE, cause);
    }
    
    public SecretRotationException(String message, String errorCode) {
        super(message, errorCode);
    }
    
    public SecretRotationException(String message, String errorCode, Throwable cause) {
        super(message, errorCode, cause);
    }
}


package com.bank.signature.domain.exception;

/**
 * Exception thrown when Vault operations fail.
 * Story 13.5: Vault Integration for Credentials
 */
public class VaultException extends DomainException {
    
    public VaultException(String message) {
        super(message, "VAULT_ERROR");
    }
    
    public VaultException(String message, Throwable cause) {
        super(message, "VAULT_ERROR", cause);
    }
}


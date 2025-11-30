package com.bank.signature.domain.exception;

import com.bank.signature.domain.model.valueobject.ProviderType;

/**
 * Exception thrown when a provider call fails.
 * Story 2.5: SMS Provider Integration (Twilio)
 */
public class ProviderException extends DomainException {
    
    private final ProviderType providerType;
    private final String providerErrorCode;
    
    public ProviderException(ProviderType providerType, String message) {
        super("PROVIDER_ERROR", String.format("[%s] %s", providerType, message));
        this.providerType = providerType;
        this.providerErrorCode = null;
    }
    
    public ProviderException(ProviderType providerType, String message, String providerErrorCode) {
        super("PROVIDER_ERROR", String.format("[%s] %s (code: %s)", providerType, message, providerErrorCode));
        this.providerType = providerType;
        this.providerErrorCode = providerErrorCode;
    }
    
    public ProviderException(ProviderType providerType, String message, Throwable cause) {
        super(String.format("[%s] %s", providerType, message), "PROVIDER_ERROR", cause);
        this.providerType = providerType;
        this.providerErrorCode = null;
    }
    
    public ProviderType getProviderType() {
        return providerType;
    }
    
    public String getProviderErrorCode() {
        return providerErrorCode;
    }
}


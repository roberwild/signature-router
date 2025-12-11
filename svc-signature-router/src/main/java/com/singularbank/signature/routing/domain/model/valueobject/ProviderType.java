package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Abstract provider types for challenge delivery channels.
 * 
 * <p>This enum represents the delivery mechanism type, NOT specific vendor implementations.
 * This abstraction allows the domain layer to remain pure and vendor-agnostic.
 * 
 * <p><strong>Usage Example:</strong>
 * <pre>{@code
 * ProviderType sms = ProviderType.SMS;
 * String display = sms.getDisplayName(); // "SMS Provider"
 * }</pre>
 * 
 * @since Story 3.1 - Provider Abstraction Interface
 */
public enum ProviderType {
    /** SMS channel provider (text message delivery). */
    SMS("SMS Provider"),
    
    /** Push notification channel provider (mobile app notifications). */
    PUSH("Push Notification Provider"),
    
    /** Voice call channel provider (IVR/phone call delivery). */
    VOICE("Voice Call Provider"),
    
    /** Biometric channel provider (fingerprint, face recognition). */
    BIOMETRIC("Biometric Provider");
    
    private final String displayName;
    
    ProviderType(String displayName) {
        this.displayName = displayName;
    }
    
    /**
     * Gets the human-readable display name for this provider type.
     * 
     * @return the display name (e.g., "SMS Provider", "Push Notification Provider")
     */
    public String getDisplayName() {
        return displayName;
    }
}



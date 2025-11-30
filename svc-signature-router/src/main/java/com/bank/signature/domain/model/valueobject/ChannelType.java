package com.bank.signature.domain.model.valueobject;

/**
 * Signature challenge delivery channel types.
 * 
 * <p>Represents the delivery channel from the business perspective.
 * Each channel type maps to an abstract {@link ProviderType} for provider selection.
 * 
 * @since Story 1.5
 */
public enum ChannelType {
    /** SMS channel (OTP via text message). */
    SMS,
    
    /** Push notification channel (mobile app). */
    PUSH,
    
    /** Voice call channel (IVR system). */
    VOICE,
    
    /** Biometric channel (fingerprint, face recognition). */
    BIOMETRIC;
    
    /**
     * Maps this channel type to the corresponding abstract provider type.
     * 
     * <p>This mapping enables the domain layer to request a provider by channel
     * without being coupled to specific vendor implementations.
     * 
     * <p><strong>Mapping:</strong>
     * <ul>
     * <li>SMS → ProviderType.SMS</li>
     * <li>PUSH → ProviderType.PUSH</li>
     * <li>VOICE → ProviderType.VOICE</li>
     * <li>BIOMETRIC → ProviderType.BIOMETRIC</li>
     * </ul>
     * 
     * @return the corresponding ProviderType for this channel
     * @since Story 3.1 - Provider Abstraction Interface
     */
    public ProviderType toProviderType() {
        return switch (this) {
            case SMS -> ProviderType.SMS;
            case PUSH -> ProviderType.PUSH;
            case VOICE -> ProviderType.VOICE;
            case BIOMETRIC -> ProviderType.BIOMETRIC;
        };
    }
}



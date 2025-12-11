package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Channel type alias for ProviderType.
 * 
 * <p>This is a type alias to maintain backward compatibility with code
 * that references "Channel" instead of "ProviderType".
 * 
 * <p>In the domain model, Channel and ProviderType are synonymous:
 * - Channel: Delivery channel for signatures (SMS, PUSH, VOICE, BIOMETRIC)
 * - ProviderType: Type of provider handling the channel
 * 
 * @deprecated Use {@link ProviderType} directly instead
 * @since Compatibility layer
 */
@Deprecated(since = "0.1.0", forRemoval = false)
public enum Channel {
    /** SMS channel (text message delivery). */
    SMS,
    
    /** Push notification channel (mobile app notifications). */
    PUSH,
    
    /** Voice call channel (IVR/phone call delivery). */
    VOICE,
    
    /** Biometric channel (fingerprint, face recognition). */
    BIOMETRIC;
    
    /**
     * Converts this Channel to its corresponding ProviderType.
     * 
     * @return the equivalent ProviderType
     */
    public ProviderType toProviderType() {
        return ProviderType.valueOf(this.name());
    }
    
    /**
     * Creates a Channel from a ProviderType.
     * 
     * @param providerType the provider type
     * @return the equivalent Channel
     */
    public static Channel fromProviderType(ProviderType providerType) {
        return Channel.valueOf(providerType.name());
    }
}


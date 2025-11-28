package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ProviderResult;

/**
 * Outbound port for signature challenge delivery via external providers.
 * Story 2.5: SMS Provider Integration (Twilio)
 * 
 * This interface abstracts the communication with external signature providers
 * (SMS, Push, Voice, Biometric) following hexagonal architecture.
 * 
 * Implementations:
 * - TwilioSmsProvider (Story 2.5)
 * - FcmPushProvider (Story 2.6)
 * - TwilioVoiceProvider (Story 2.7)
 * - BiometricSdkProvider (Story 3.5)
 */
public interface SignatureProvider {
    
    /**
     * Sends a signature challenge to the user via the provider's channel.
     * 
     * Process:
     * 1. Authenticate with provider (API key, token, etc.)
     * 2. Send challenge (SMS, Push, Voice call)
     * 3. Receive confirmation (Message SID, notification ID, etc.)
     * 4. Return provider result with proof
     * 
     * @param challenge The signature challenge to send
     * @param phoneNumber User's phone number (for SMS/Voice) or device token (for Push)
     * @return ProviderResult with provider challenge ID and proof
     * @throws com.bank.signature.domain.exception.ProviderException if provider call fails
     * @throws java.util.concurrent.TimeoutException if call exceeds timeout (5s)
     */
    ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber);
    
    /**
     * Checks if the provider is available (health check).
     * 
     * @return true if provider is reachable and healthy, false otherwise
     */
    boolean isAvailable();
}


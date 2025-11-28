package com.bank.signature.config;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.port.outbound.SignatureProvider;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.util.UUID;

/**
 * Test configuration for provider stubs.
 * Story 2.5: SMS Provider Integration (Twilio)
 * 
 * Provides mock implementations of providers for testing
 * without requiring real provider credentials.
 */
@TestConfiguration
@Profile("test")
public class TestProviderConfig {
    
    /**
     * Mock Twilio SMS Provider for testing.
     * Returns successful provider results without making real API calls.
     */
    @Bean("twilioSmsProvider")
    @Primary
    public SignatureProvider mockTwilioSmsProvider() {
        return new SignatureProvider() {
            
            @Override
            public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
                // Mock successful send
                String mockMessageSid = "SM" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
                String mockProof = "twilio_sig:" + mockMessageSid + ":queued";
                
                return ProviderResult.of(mockMessageSid, mockProof);
            }
            
            @Override
            public boolean isAvailable() {
                return true;
            }
        };
    }
}


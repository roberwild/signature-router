package com.bank.signature.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link ChannelType} enum.
 * Story 3.1: Provider Abstraction Interface - ChannelType to ProviderType mapping
 */
class ChannelTypeTest {
    
    @Test
    void toProviderType_shouldMapSmsToSmsProvider() {
        // When
        ProviderType providerType = ChannelType.SMS.toProviderType();
        
        // Then
        assertThat(providerType).isEqualTo(ProviderType.SMS);
    }
    
    @Test
    void toProviderType_shouldMapPushToPushProvider() {
        // When
        ProviderType providerType = ChannelType.PUSH.toProviderType();
        
        // Then
        assertThat(providerType).isEqualTo(ProviderType.PUSH);
    }
    
    @Test
    void toProviderType_shouldMapVoiceToVoiceProvider() {
        // When
        ProviderType providerType = ChannelType.VOICE.toProviderType();
        
        // Then
        assertThat(providerType).isEqualTo(ProviderType.VOICE);
    }
    
    @Test
    void toProviderType_shouldMapBiometricToBiometricProvider() {
        // When
        ProviderType providerType = ChannelType.BIOMETRIC.toProviderType();
        
        // Then
        assertThat(providerType).isEqualTo(ProviderType.BIOMETRIC);
    }
    
    @Test
    void toProviderType_shouldMapAllChannelTypes() {
        // When/Then - Iterate all ChannelType values and ensure they map correctly
        for (ChannelType channelType : ChannelType.values()) {
            ProviderType providerType = channelType.toProviderType();
            
            // Verify mapping is correct (names should match)
            assertThat(providerType.name()).isEqualTo(channelType.name());
            assertThat(providerType).isNotNull();
        }
    }
    
    @Test
    void values_shouldContainAllChannelTypes() {
        // When
        ChannelType[] values = ChannelType.values();
        
        // Then
        assertThat(values).hasSize(4);
        assertThat(values).contains(
            ChannelType.SMS,
            ChannelType.PUSH,
            ChannelType.VOICE,
            ChannelType.BIOMETRIC
        );
    }
}


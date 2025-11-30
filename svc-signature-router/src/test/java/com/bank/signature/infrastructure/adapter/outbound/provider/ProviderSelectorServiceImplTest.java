package com.bank.signature.infrastructure.adapter.outbound.provider;

import com.bank.signature.domain.exception.NoAvailableProviderException;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for ProviderSelectorServiceImpl.
 * Story 2.4: Challenge Creation & Provider Selection
 */
@DisplayName("ProviderSelectorService")
class ProviderSelectorServiceImplTest {
    
    private ProviderSelectorServiceImpl providerSelectorService;
    
    @BeforeEach
    void setUp() {
        providerSelectorService = new ProviderSelectorServiceImpl();
    }
    
    @Test
    @DisplayName("Should select SMS provider for SMS channel")
    void shouldSelectSmsProviderForSms() {
        // When
        ProviderType provider = providerSelectorService.selectProvider(ChannelType.SMS);
        
        // Then
        assertThat(provider).isEqualTo(ProviderType.SMS);
    }
    
    @Test
    @DisplayName("Should select FCM for PUSH channel")
    void shouldSelectFcmForPush() {
        // When
        ProviderType provider = providerSelectorService.selectProvider(ChannelType.PUSH);
        
        // Then
        assertThat(provider).isEqualTo(ProviderType.PUSH);
    }
    
    @Test
    @DisplayName("Should select VOICE provider for VOICE channel")
    void shouldSelectVoiceProviderForVoice() {
        // When
        ProviderType provider = providerSelectorService.selectProvider(ChannelType.VOICE);
        
        // Then
        assertThat(provider).isEqualTo(ProviderType.VOICE);
    }
    
    @Test
    @DisplayName("Should select BIOMETRIC_SDK for BIOMETRIC channel")
    void shouldSelectBiometricSdkForBiometric() {
        // When
        ProviderType provider = providerSelectorService.selectProvider(ChannelType.BIOMETRIC);
        
        // Then
        assertThat(provider).isEqualTo(ProviderType.BIOMETRIC);
    }
    
    @Test
    @DisplayName("Should throw exception for null channel type")
    void shouldThrowExceptionForNullChannelType() {
        // When / Then
        assertThatThrownBy(() -> providerSelectorService.selectProvider(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("channelType cannot be null");
    }
    
    @Test
    @DisplayName("Should return true for provider availability (Story 2.4 - no circuit breaker yet)")
    void shouldReturnTrueForProviderAvailability() {
        // When / Then - For Story 2.4, always returns true
        assertThat(providerSelectorService.isProviderAvailable(ProviderType.SMS)).isTrue();
        assertThat(providerSelectorService.isProviderAvailable(ProviderType.PUSH)).isTrue();
        assertThat(providerSelectorService.isProviderAvailable(ProviderType.VOICE)).isTrue();
        assertThat(providerSelectorService.isProviderAvailable(ProviderType.BIOMETRIC)).isTrue();
    }
}


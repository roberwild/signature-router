package com.singularbank.signature.routing.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link ProviderType} enum.
 * Story 3.1: Provider Abstraction Interface
 */
class ProviderTypeTest {
    
    @Test
    void values_shouldContainAllProviderTypes() {
        // When
        ProviderType[] values = ProviderType.values();
        
        // Then
        assertThat(values).hasSize(4);
        assertThat(values).contains(
            ProviderType.SMS,
            ProviderType.PUSH,
            ProviderType.VOICE,
            ProviderType.BIOMETRIC
        );
    }
    
    @Test
    void getDisplayName_shouldReturnDescriptiveNames() {
        // Then
        assertThat(ProviderType.SMS.getDisplayName()).isEqualTo("SMS Provider");
        assertThat(ProviderType.PUSH.getDisplayName()).isEqualTo("Push Notification Provider");
        assertThat(ProviderType.VOICE.getDisplayName()).isEqualTo("Voice Call Provider");
        assertThat(ProviderType.BIOMETRIC.getDisplayName()).isEqualTo("Biometric Provider");
    }
    
    @Test
    void valueOf_shouldReturnCorrectEnum() {
        // When/Then
        assertThat(ProviderType.valueOf("SMS")).isEqualTo(ProviderType.SMS);
        assertThat(ProviderType.valueOf("PUSH")).isEqualTo(ProviderType.PUSH);
        assertThat(ProviderType.valueOf("VOICE")).isEqualTo(ProviderType.VOICE);
        assertThat(ProviderType.valueOf("BIOMETRIC")).isEqualTo(ProviderType.BIOMETRIC);
    }
    
    @Test
    void valueOf_shouldThrowForInvalidValue() {
        // When/Then
        assertThatThrownBy(() -> ProviderType.valueOf("INVALID"))
            .isInstanceOf(IllegalArgumentException.class);
    }
    
    @Test
    void toString_shouldReturnEnumName() {
        // Then
        assertThat(ProviderType.SMS.toString()).isEqualTo("SMS");
        assertThat(ProviderType.PUSH.toString()).isEqualTo("PUSH");
        assertThat(ProviderType.VOICE.toString()).isEqualTo("VOICE");
        assertThat(ProviderType.BIOMETRIC.toString()).isEqualTo("BIOMETRIC");
    }
    
    @Test
    void allDisplayNames_shouldBeNonNull() {
        // When/Then
        for (ProviderType type : ProviderType.values()) {
            assertThat(type.getDisplayName())
                .isNotNull()
                .isNotBlank();
        }
    }
}


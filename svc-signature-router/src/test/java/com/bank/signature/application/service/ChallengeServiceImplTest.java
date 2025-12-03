package com.bank.signature.application.service;

import com.bank.signature.domain.exception.FallbackLoopException;
import com.bank.signature.domain.exception.ProviderException;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import com.bank.signature.domain.service.ProviderSelectorService;
import com.bank.signature.infrastructure.config.FallbackChainConfig;
import com.bank.signature.infrastructure.observability.metrics.ChallengeMetrics;
import com.bank.signature.infrastructure.resilience.DegradedModeManager;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ChallengeServiceImpl.
 * Tests challenge creation, provider selection, fallback logic, and degraded mode handling.
 *
 * Coverage:
 * - Challenge creation and sending
 * - Provider selection and fallback chains
 * - Fallback loop prevention
 * - Degraded mode handling
 * - Circuit breaker integration
 * - Metrics recording
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChallengeServiceImpl Tests")
class ChallengeServiceImplTest {

    @Mock
    private ProviderSelectorService providerSelectorService;

    @Mock
    private SignatureProviderPort signatureProviderAdapter;

    @Mock
    private FallbackChainConfig fallbackChainConfig;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private DegradedModeManager degradedModeManager;

    @Mock
    private ChallengeMetrics challengeMetrics;

    @Mock
    private Counter counter;

    @InjectMocks
    private ChallengeServiceImpl challengeService;

    @Mock
    private SignatureRequest signatureRequest;

    @Mock
    private SignatureChallenge challenge;

    private UUID requestId;
    private UUID challengeId;

    @BeforeEach
    void setUp() {
        requestId = UUID.randomUUID();
        challengeId = UUID.randomUUID();

        // Set maxFallbackAttempts via reflection
        ReflectionTestUtils.setField(challengeService, "maxFallbackAttempts", 3);

        // Setup signature request mock
        when(signatureRequest.getId()).thenReturn(requestId);
        when(signatureRequest.createChallenge(any(), any())).thenReturn(challenge);

        // Setup challenge mock
        when(challenge.getId()).thenReturn(challengeId);
        when(challenge.getChannelType()).thenReturn(ChannelType.SMS);
        when(challenge.getProvider()).thenReturn(ProviderType.SMS);
        when(challenge.getStatus()).thenReturn(com.bank.signature.domain.model.valueobject.ChallengeStatus.PENDING);

        // Setup counter mock
        when(meterRegistry.counter(anyString(), any(String.class), any(String.class)))
            .thenReturn(counter);
        when(meterRegistry.counter(anyString())).thenReturn(counter);
    }

    @Test
    @DisplayName("Should create and send challenge successfully in normal mode")
    void shouldCreateAndSendChallenge_NormalMode() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult successResult = ProviderResult.success("provider-challenge-123");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(successResult);

        // When
        SignatureChallenge result = challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        );

        // Then
        assertThat(result).isEqualTo(challenge);

        verify(degradedModeManager).isInDegradedMode();
        verify(providerSelectorService).selectProvider(ChannelType.SMS);
        verify(signatureRequest).createChallenge(ChannelType.SMS, ProviderType.SMS);
        verify(signatureProviderAdapter).sendChallenge(challenge, phoneNumber);
        verify(challenge).markAsSent(successResult);
        verify(challengeMetrics).recordSent(challenge, ProviderType.SMS);
    }

    @Test
    @DisplayName("Should skip sending challenge in degraded mode")
    void shouldSkipSendingChallenge_DegradedMode() {
        // Given
        String phoneNumber = "+1234567890";

        when(degradedModeManager.isInDegradedMode()).thenReturn(true);
        when(degradedModeManager.getDegradedReason()).thenReturn("Database unavailable");
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);

        // When
        SignatureChallenge result = challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        );

        // Then
        assertThat(result).isEqualTo(challenge);

        verify(degradedModeManager).isInDegradedMode();
        verify(degradedModeManager).getDegradedReason();
        verify(providerSelectorService).selectProvider(ChannelType.SMS);
        verify(signatureRequest).createChallenge(ChannelType.SMS, ProviderType.SMS);
        // Should NOT call provider or mark as sent
        verify(signatureProviderAdapter, never()).sendChallenge(any(), any());
        verify(challenge, never()).markAsSent(any());
    }

    @Test
    @DisplayName("Should trigger fallback when primary provider fails")
    void shouldTriggerFallback_WhenPrimaryFails() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult primaryFailure = ProviderResult.failure("TIMEOUT", "Provider timeout");
        ProviderResult fallbackSuccess = ProviderResult.success("fallback-challenge-456");

        SignatureChallenge fallbackChallenge = mock(SignatureChallenge.class);
        when(fallbackChallenge.getId()).thenReturn(UUID.randomUUID());
        when(fallbackChallenge.getProvider()).thenReturn(ProviderType.VOICE);

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(true);
        when(fallbackChainConfig.hasFallback(ChannelType.SMS)).thenReturn(true);
        when(fallbackChainConfig.getFallbackChannel(ChannelType.SMS)).thenReturn(ChannelType.VOICE);
        when(providerSelectorService.selectProvider(ChannelType.VOICE)).thenReturn(ProviderType.VOICE);

        // Primary fails, fallback succeeds
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(primaryFailure);
        when(signatureRequest.createChallenge(ChannelType.VOICE, ProviderType.VOICE))
            .thenReturn(fallbackChallenge);
        when(signatureProviderAdapter.sendChallenge(fallbackChallenge, phoneNumber))
            .thenReturn(fallbackSuccess);

        // When
        SignatureChallenge result = challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        );

        // Then
        assertThat(result).isEqualTo(challenge);

        verify(fallbackChainConfig).isEnabled();
        verify(fallbackChainConfig).hasFallback(ChannelType.SMS);
        verify(fallbackChainConfig).getFallbackChannel(ChannelType.SMS);
        verify(challenge).fail(primaryFailure.errorCode());
        verify(fallbackChallenge).markAsSent(fallbackSuccess);
        verify(counter, atLeastOnce()).increment();
    }

    @Test
    @DisplayName("Should throw ProviderException when all attempts fail")
    void shouldThrowProviderException_WhenAllAttemptsFail() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult primaryFailure = ProviderResult.failure("ERROR", "Provider error");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(false);  // No fallback
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(primaryFailure);

        // When/Then
        assertThatThrownBy(() -> challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        ))
            .isInstanceOf(ProviderException.class)
            .hasMessageContaining("Provider error");

        verify(challenge).fail(primaryFailure.errorCode());
    }

    @Test
    @DisplayName("Should handle circuit breaker open exception")
    void shouldHandleCircuitBreakerOpen() {
        // Given
        String phoneNumber = "+1234567890";

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(false);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber))
            .thenThrow(new CallNotPermittedException(null));

        // When/Then
        assertThatThrownBy(() -> challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        ))
            .isInstanceOf(ProviderException.class)
            .hasMessageContaining("Circuit breaker is OPEN");

        verify(challenge).fail("CIRCUIT_OPEN");
    }

    @Test
    @DisplayName("Should not fallback when fallback disabled")
    void shouldNotFallback_WhenDisabled() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult primaryFailure = ProviderResult.failure("ERROR", "Provider error");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(false);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(primaryFailure);

        // When/Then
        assertThatThrownBy(() -> challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        ))
            .isInstanceOf(ProviderException.class);

        verify(fallbackChainConfig).isEnabled();
        verify(fallbackChainConfig, never()).hasFallback(any());
        verify(fallbackChainConfig, never()).getFallbackChannel(any());
    }

    @Test
    @DisplayName("Should not fallback when no fallback configured for channel")
    void shouldNotFallback_WhenNoFallbackConfigured() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult primaryFailure = ProviderResult.failure("ERROR", "Provider error");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(true);
        when(fallbackChainConfig.hasFallback(ChannelType.SMS)).thenReturn(false);  // No fallback
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(primaryFailure);

        // When/Then
        assertThatThrownBy(() -> challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        ))
            .isInstanceOf(ProviderException.class);

        verify(fallbackChainConfig).hasFallback(ChannelType.SMS);
        verify(fallbackChainConfig, never()).getFallbackChannel(any());
    }

    @Test
    @DisplayName("Should record metrics when challenge sent successfully")
    void shouldRecordMetrics_WhenChallengeSuccess() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult successResult = ProviderResult.success("provider-challenge-123");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(successResult);

        // When
        challengeService.createChallenge(signatureRequest, ChannelType.SMS, phoneNumber);

        // Then
        verify(challengeMetrics).recordSent(challenge, ProviderType.SMS);
    }

    @Test
    @DisplayName("Should increment fallback triggered counter")
    void shouldIncrementFallbackTriggeredCounter() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult primaryFailure = ProviderResult.failure("TIMEOUT", "Provider timeout");
        ProviderResult fallbackSuccess = ProviderResult.success("fallback-challenge-456");

        SignatureChallenge fallbackChallenge = mock(SignatureChallenge.class);
        when(fallbackChallenge.getId()).thenReturn(UUID.randomUUID());
        when(fallbackChallenge.getProvider()).thenReturn(ProviderType.VOICE);

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(true);
        when(fallbackChainConfig.hasFallback(ChannelType.SMS)).thenReturn(true);
        when(fallbackChainConfig.getFallbackChannel(ChannelType.SMS)).thenReturn(ChannelType.VOICE);
        when(providerSelectorService.selectProvider(ChannelType.VOICE)).thenReturn(ProviderType.VOICE);

        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(primaryFailure);
        when(signatureRequest.createChallenge(ChannelType.VOICE, ProviderType.VOICE))
            .thenReturn(fallbackChallenge);
        when(signatureProviderAdapter.sendChallenge(fallbackChallenge, phoneNumber))
            .thenReturn(fallbackSuccess);

        // When
        challengeService.createChallenge(signatureRequest, ChannelType.SMS, phoneNumber);

        // Then
        verify(meterRegistry).counter("fallback.triggered", "from", "SMS", "to", "VOICE");
        verify(meterRegistry).counter("fallback.success", "from", "SMS", "to", "VOICE");
        verify(counter, atLeastOnce()).increment();
    }

    @Test
    @DisplayName("Should handle unexpected exception from provider")
    void shouldHandleUnexpectedException() {
        // Given
        String phoneNumber = "+1234567890";

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.SMS)).thenReturn(ProviderType.SMS);
        when(fallbackChainConfig.isEnabled()).thenReturn(false);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber))
            .thenThrow(new RuntimeException("Unexpected error"));

        // When/Then
        assertThatThrownBy(() -> challengeService.createChallenge(
            signatureRequest,
            ChannelType.SMS,
            phoneNumber
        ))
            .isInstanceOf(ProviderException.class)
            .hasMessageContaining("Unexpected error");

        verify(challenge).fail("PROVIDER_ERROR");
    }

    @Test
    @DisplayName("Should select provider based on channel type")
    void shouldSelectProviderBasedOnChannelType() {
        // Given
        String phoneNumber = "+1234567890";
        ProviderResult successResult = ProviderResult.success("provider-challenge-123");

        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(providerSelectorService.selectProvider(ChannelType.PUSH)).thenReturn(ProviderType.PUSH);
        when(signatureRequest.createChallenge(ChannelType.PUSH, ProviderType.PUSH)).thenReturn(challenge);
        when(challenge.getProvider()).thenReturn(ProviderType.PUSH);
        when(signatureProviderAdapter.sendChallenge(challenge, phoneNumber)).thenReturn(successResult);

        // When
        challengeService.createChallenge(signatureRequest, ChannelType.PUSH, phoneNumber);

        // Then
        verify(providerSelectorService).selectProvider(ChannelType.PUSH);
        verify(signatureRequest).createChallenge(ChannelType.PUSH, ProviderType.PUSH);
    }
}

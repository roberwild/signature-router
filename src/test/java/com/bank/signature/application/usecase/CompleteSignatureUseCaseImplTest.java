package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.CompleteSignatureDto;
import com.bank.signature.domain.event.SignatureCompletedEvent;
import com.bank.signature.domain.exception.InvalidChallengeCodeException;
import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.exception.NotFoundException;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import com.bank.signature.domain.port.outbound.EventPublisher;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import com.bank.signature.infrastructure.util.CorrelationIdProvider;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompleteSignatureUseCaseImpl.
 * 
 * Story 10.3: Use Case Tests - Testing Coverage >85%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Happy path (código correcto → SIGNED)</li>
 *   <li>Código incorrecto → error (max 3 intentos)</li>
 *   <li>Challenge expirado → exception</li>
 *   <li>Challenge no encontrado → NotFoundException</li>
 *   <li>Challenge no en estado SENT → InvalidStateTransitionException</li>
 *   <li>Max attempts exceeded → challenge marcado como FAILED</li>
 *   <li>Publicación de evento</li>
 *   <li>Métricas registradas</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompleteSignatureUseCaseImpl Tests")
class CompleteSignatureUseCaseImplTest {

    @Mock
    private SignatureRequestRepository repository;
    @Mock
    private EventPublisher eventPublisher;
    @Mock
    private CorrelationIdProvider correlationIdProvider;
    
    private MeterRegistry meterRegistry;
    private CompleteSignatureUseCaseImpl useCase;

    private UUID signatureRequestId;
    private UUID challengeId;
    private CompleteSignatureDto completeDto;
    private SignatureRequest signatureRequest;
    private SignatureChallenge challenge;
    private TransactionContext transactionContext;

    @BeforeEach
    void setUp() {
        signatureRequestId = UUID.randomUUID();
        challengeId = UUID.randomUUID();
        completeDto = new CompleteSignatureDto(challengeId, "123456");

        // Create transaction context
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "a".repeat(64);
        transactionContext = new TransactionContext(
            amount,
            "merchant-123",
            "order-456",
            "Test transaction",
            hash
        );

        // Create challenge
        challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode("123456")
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();

        // Create signature request
        signatureRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId("customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge)))
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();

        // Use real SimpleMeterRegistry instead of mock to avoid NullPointerException
        // SimpleMeterRegistry is lightweight and has no side effects
        meterRegistry = new SimpleMeterRegistry();
        
        // Create use case instance manually since MeterRegistry is not a mock
        useCase = new CompleteSignatureUseCaseImpl(
            repository,
            eventPublisher,
            correlationIdProvider,
            meterRegistry
        );
    }

    @Test
    @DisplayName("Should complete signature successfully with correct code")
    void shouldCompleteSignatureSuccessfullyWithCorrectCode() {
        // Given
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(correlationIdProvider.getCorrelationId()).thenReturn("correlation-123");

        // When
        var result = useCase.execute(signatureRequestId, completeDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(signatureRequestId);
        assertThat(result.status()).isEqualTo(SignatureStatus.SIGNED);
        assertThat(result.completedAt()).isNotNull();
        
        // Verify challenge was completed
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.COMPLETED);
        
        // Verify signature request was completed
        assertThat(signatureRequest.getStatus()).isEqualTo(SignatureStatus.SIGNED);
        
        // Verify interactions
        verify(repository).findById(signatureRequestId);
        verify(repository).save(any(SignatureRequest.class));
        
        // Verify event was published
        ArgumentCaptor<SignatureCompletedEvent> eventCaptor = ArgumentCaptor.forClass(SignatureCompletedEvent.class);
        verify(eventPublisher).publish(eventCaptor.capture());
        SignatureCompletedEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.signatureRequestId()).isEqualTo(signatureRequestId);
        assertThat(publishedEvent.challengeId()).isEqualTo(challengeId);
        assertThat(publishedEvent.channelType()).isEqualTo(ChannelType.SMS);
    }

    @Test
    @DisplayName("Should throw exception when signature request not found")
    void shouldThrowExceptionWhenSignatureRequestNotFound() {
        // Given
        when(repository.findById(signatureRequestId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, completeDto))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Signature request not found: " + signatureRequestId);
        
        verify(repository).findById(signatureRequestId);
        verify(repository, never()).save(any());
        verify(eventPublisher, never()).publish(any());
    }

    @Test
    @DisplayName("Should throw exception when challenge not found")
    void shouldThrowExceptionWhenChallengeNotFound() {
        // Given
        UUID nonExistentChallengeId = UUID.randomUUID();
        CompleteSignatureDto invalidDto = new CompleteSignatureDto(nonExistentChallengeId, "123456");
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));

        // When/Then
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, invalidDto))
            .isInstanceOf(com.bank.signature.domain.exception.ChallengeNotFoundException.class);
        
        verify(repository).findById(signatureRequestId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when challenge not in SENT status")
    void shouldThrowExceptionWhenChallengeNotInSentStatus() {
        // Given
        challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING) // Not SENT
            .challengeCode("123456")
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(120))
            .build();
        
        signatureRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId("customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge)))
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(120))
            .build();
        
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));

        // When/Then
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, completeDto))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Challenge not in valid state for completion");
        
        verify(repository).findById(signatureRequestId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when challenge expired")
    void shouldThrowExceptionWhenChallengeExpired() {
        // Given
        challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode("123456")
            .createdAt(Instant.now().minusSeconds(200))
            .expiresAt(Instant.now().minusSeconds(20)) // Expired
            .build();
        
        signatureRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId("customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge)))
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(120))
            .build();
        
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When/Then
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, completeDto))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Challenge has expired");
        
        verify(repository).findById(signatureRequestId);
        verify(repository).save(any(SignatureRequest.class)); // Challenge expired, so saved
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.EXPIRED);
    }

    @Test
    @DisplayName("Should throw exception when code is incorrect")
    void shouldThrowExceptionWhenCodeIsIncorrect() {
        // Given
        CompleteSignatureDto wrongCodeDto = new CompleteSignatureDto(challengeId, "999999");
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));

        // When/Then
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, wrongCodeDto))
            .isInstanceOf(InvalidChallengeCodeException.class);
        
        verify(repository).findById(signatureRequestId);
        verify(repository, never()).save(any()); // Not saved on first failed attempt
        verify(eventPublisher, never()).publish(any());
    }

    @Test
    @DisplayName("Should fail challenge after max attempts exceeded")
    void shouldFailChallengeAfterMaxAttemptsExceeded() {
        // Given
        CompleteSignatureDto wrongCodeDto = new CompleteSignatureDto(challengeId, "999999");
        
        // Use Answer to return fresh challenge for each call, but track state changes
        final SignatureRequest[] requestHolder = new SignatureRequest[] { signatureRequest };
        
        when(repository.findById(signatureRequestId)).thenAnswer(invocation -> {
            // Return current state of request (challenge may have been modified)
            return Optional.of(requestHolder[0]);
        });
        
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> {
            SignatureRequest saved = invocation.getArgument(0);
            // Update holder to reflect saved state
            requestHolder[0] = saved;
            challenge = saved.getChallenges().get(0); // Update challenge reference
            return saved;
        });

        // When - Attempt 1
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, wrongCodeDto))
            .isInstanceOf(InvalidChallengeCodeException.class);

        // Recreate challenge in SENT status for attempt 2
        challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode("123456")
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();
        requestHolder[0] = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId("customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge)))
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();

        // Attempt 2
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, wrongCodeDto))
            .isInstanceOf(InvalidChallengeCodeException.class);

        // Recreate challenge in SENT status for attempt 3
        challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode("123456")
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();
        requestHolder[0] = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId("customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge)))
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now().minusSeconds(60))
            .expiresAt(Instant.now().plusSeconds(120))
            .build();

        // Attempt 3 (max attempts - should fail challenge)
        assertThatThrownBy(() -> useCase.execute(signatureRequestId, wrongCodeDto))
            .isInstanceOf(InvalidChallengeCodeException.class);

        // Then - Challenge should be marked as FAILED after 3 attempts
        verify(repository, atLeast(3)).findById(signatureRequestId);
        verify(repository, atLeastOnce()).save(any(SignatureRequest.class)); // Saved when max attempts exceeded
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("MAX_ATTEMPTS_EXCEEDED");
    }

    @Test
    @DisplayName("Should publish SignatureCompletedEvent")
    void shouldPublishSignatureCompletedEvent() {
        // Given
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(correlationIdProvider.getCorrelationId()).thenReturn("correlation-123");

        // When
        useCase.execute(signatureRequestId, completeDto);

        // Then
        ArgumentCaptor<SignatureCompletedEvent> eventCaptor = ArgumentCaptor.forClass(SignatureCompletedEvent.class);
        verify(eventPublisher).publish(eventCaptor.capture());
        
        SignatureCompletedEvent event = eventCaptor.getValue();
        assertThat(event.signatureRequestId()).isEqualTo(signatureRequestId);
        assertThat(event.challengeId()).isEqualTo(challengeId);
        assertThat(event.channelType()).isEqualTo(ChannelType.SMS);
        assertThat(event.correlationId()).isEqualTo("correlation-123");
    }

    @Test
    @DisplayName("Should record metrics on successful completion")
    void shouldRecordMetricsOnSuccessfulCompletion() {
        // Given
        when(repository.findById(signatureRequestId)).thenReturn(Optional.of(signatureRequest));
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(correlationIdProvider.getCorrelationId()).thenReturn("correlation-123");

        // When
        useCase.execute(signatureRequestId, completeDto);

        // Then - Verify metrics were recorded by checking SimpleMeterRegistry
        // SimpleMeterRegistry is real, so we can check that counters/timers were created
        assertThat(meterRegistry.find("signatures.completed").counter()).isNotNull();
        assertThat(meterRegistry.find("signatures.completion.duration").timer()).isNotNull();
    }
}


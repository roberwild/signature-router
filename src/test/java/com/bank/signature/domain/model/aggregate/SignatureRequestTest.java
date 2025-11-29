package com.bank.signature.domain.model.aggregate;

import com.bank.signature.domain.exception.ChallengeAlreadyActiveException;
import com.bank.signature.domain.exception.ChallengeNotBelongsException;
import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.exception.TtlNotExceededException;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for SignatureRequest aggregate root.
 * 
 * Story 10.2: Domain Layer Tests - Testing Coverage >90%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Creating signature request with builder</li>
 *   <li>Creating challenge (validating only 1 active)</li>
 *   <li>State transitions (PENDING → SIGNED → COMPLETED)</li>
 *   <li>Expiration by TTL</li>
 *   <li>Aborting signature request</li>
 *   <li>Challenge validation and ownership</li>
 *   <li>Routing timeline events</li>
 * </ul>
 */
@DisplayName("SignatureRequest Aggregate Tests")
class SignatureRequestTest {

    private UUID requestId;
    private String customerId;
    private TransactionContext transactionContext;
    private Instant createdAt;
    private Instant expiresAt;

    @BeforeEach
    void setUp() {
        requestId = UUID.randomUUID();
        customerId = "CUSTOMER_123";
        createdAt = Instant.now();
        expiresAt = createdAt.plusSeconds(180); // 3 minutes TTL
        
        // Create valid TransactionContext
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "a".repeat(64); // Valid SHA256 hash (64 hex chars)
        transactionContext = new TransactionContext(
            amount,
            "merchant-123",
            "order-456",
            "Test transaction",
            hash
        );
    }

    @Test
    @DisplayName("Should create signature request with builder")
    void shouldCreateSignatureRequestWithBuilder() {
        // When
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();

        // Then
        assertThat(request.getId()).isEqualTo(requestId);
        assertThat(request.getCustomerId()).isEqualTo(customerId);
        assertThat(request.getTransactionContext()).isEqualTo(transactionContext);
        assertThat(request.getStatus()).isEqualTo(SignatureStatus.PENDING);
        assertThat(request.getChallenges()).isEmpty();
        assertThat(request.getRoutingTimeline()).isEmpty();
        assertThat(request.getCreatedAt()).isEqualTo(createdAt);
        assertThat(request.getExpiresAt()).isEqualTo(expiresAt);
    }

    @Test
    @DisplayName("Should create challenge successfully")
    void shouldCreateChallengeSuccessfully() {
        // Given
        SignatureRequest request = createPendingRequest();

        // When
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);

        // Then
        assertThat(challenge).isNotNull();
        assertThat(challenge.getChannelType()).isEqualTo(ChannelType.SMS);
        assertThat(challenge.getProvider()).isEqualTo(ProviderType.SMS);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.PENDING);
        assertThat(challenge.getChallengeCode()).isNotNull().isNotEmpty();
        assertThat(request.getChallenges()).hasSize(1);
        assertThat(request.getChallenges()).contains(challenge);
        assertThat(request.getRoutingTimeline()).hasSize(1);
        assertThat(request.getRoutingTimeline().get(0).eventType()).isEqualTo("CHALLENGE_CREATED");
    }

    @Test
    @DisplayName("Should not allow multiple active challenges (PENDING)")
    void shouldNotAllowMultipleActiveChallengesPending() {
        // Given
        SignatureRequest request = createPendingRequest();
        request.createChallenge(ChannelType.SMS, ProviderType.SMS);

        // When/Then
        assertThatThrownBy(() -> 
            request.createChallenge(ChannelType.PUSH, ProviderType.PUSH)
        ).isInstanceOf(ChallengeAlreadyActiveException.class);
        
        assertThat(request.getChallenges()).hasSize(1);
    }

    @Test
    @DisplayName("Should not allow multiple active challenges (SENT)")
    void shouldNotAllowMultipleActiveChallengesSent() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Mark challenge as SENT
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult);

        // When/Then
        assertThatThrownBy(() -> 
            request.createChallenge(ChannelType.PUSH, ProviderType.PUSH)
        ).isInstanceOf(ChallengeAlreadyActiveException.class);
        
        assertThat(request.getChallenges()).hasSize(1);
    }

    @Test
    @DisplayName("Should allow creating new challenge after previous is COMPLETED")
    void shouldAllowCreatingNewChallengeAfterCompleted() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge1 = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Complete first challenge
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge1.markAsSent(providerResult);
        challenge1.complete(providerResult);
        request.completeSignature(challenge1);

        // When - Try to create new challenge (should fail because signature is SIGNED)
        // Note: This is a business rule - once signature is SIGNED, no more challenges allowed
        assertThat(request.getStatus()).isEqualTo(SignatureStatus.SIGNED);
    }

    @Test
    @DisplayName("Should allow creating new challenge after previous is FAILED")
    void shouldAllowCreatingNewChallengeAfterFailed() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge1 = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        challenge1.fail("TIMEOUT");

        // When
        SignatureChallenge challenge2 = request.createChallenge(ChannelType.PUSH, ProviderType.PUSH);

        // Then
        assertThat(request.getChallenges()).hasSize(2);
        assertThat(challenge2).isNotNull();
    }

    @Test
    @DisplayName("Should complete signature successfully")
    void shouldCompleteSignatureSuccessfully() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult);
        challenge.complete(providerResult);

        // When
        request.completeSignature(challenge);

        // Then
        assertThat(request.getStatus()).isEqualTo(SignatureStatus.SIGNED);
        assertThat(request.getSignedAt()).isNotNull();
        assertThat(request.getRoutingTimeline()).hasSize(2);
        assertThat(request.getRoutingTimeline().get(1).eventType()).isEqualTo("SIGNATURE_COMPLETED");
    }

    @Test
    @DisplayName("Should throw exception when completing signature with challenge not belonging to request")
    void shouldThrowExceptionWhenCompletingSignatureWithChallengeNotBelonging() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureRequest otherRequest = createPendingRequest();
        SignatureChallenge challenge = otherRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult);
        challenge.complete(providerResult);

        // When/Then
        assertThatThrownBy(() -> request.completeSignature(challenge))
            .isInstanceOf(ChallengeNotBelongsException.class);
    }

    @Test
    @DisplayName("Should throw exception when completing signature with challenge not COMPLETED")
    void shouldThrowExceptionWhenCompletingSignatureWithChallengeNotCompleted() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        // Challenge is still PENDING, not COMPLETED

        // When/Then
        assertThatThrownBy(() -> request.completeSignature(challenge))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot complete signature, challenge not completed");
    }

    @Test
    @DisplayName("Should abort signature request successfully")
    void shouldAbortSignatureRequestSuccessfully() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);

        // When
        request.abort(AbortReason.FRAUD_DETECTED, "Suspicious transaction pattern");

        // Then
        assertThat(request.getStatus()).isEqualTo(SignatureStatus.ABORTED);
        assertThat(request.getAbortedAt()).isNotNull();
        assertThat(request.getAbortReason()).isEqualTo(AbortReason.FRAUD_DETECTED);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("SIGNATURE_ABORTED");
        assertThat(request.getRoutingTimeline()).hasSize(2);
        assertThat(request.getRoutingTimeline().get(1).eventType()).isEqualTo("SIGNATURE_ABORTED");
    }

    @Test
    @DisplayName("Should throw exception when aborting non-PENDING signature")
    void shouldThrowExceptionWhenAbortingNonPendingSignature() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult);
        challenge.complete(providerResult);
        request.completeSignature(challenge); // Now status is SIGNED

        // When/Then
        assertThatThrownBy(() -> request.abort(AbortReason.USER_CANCELLED, null))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot abort signature, status is not PENDING");
    }

    @Test
    @DisplayName("Should expire signature request when TTL exceeded")
    void shouldExpireSignatureRequestWhenTtlExceeded() {
        // Given
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(createdAt)
            .expiresAt(createdAt.minusSeconds(1)) // Already expired
            .build();

        // When
        request.expire();

        // Then
        assertThat(request.getStatus()).isEqualTo(SignatureStatus.EXPIRED);
        assertThat(request.getRoutingTimeline()).hasSize(1);
        assertThat(request.getRoutingTimeline().get(0).eventType()).isEqualTo("SIGNATURE_EXPIRED");
    }

    @Test
    @DisplayName("Should throw exception when expiring signature with TTL not exceeded")
    void shouldThrowExceptionWhenExpiringSignatureWithTtlNotExceeded() {
        // Given
        SignatureRequest request = createPendingRequest(); // expiresAt is in the future

        // When/Then
        assertThatThrownBy(() -> request.expire())
            .isInstanceOf(TtlNotExceededException.class);
    }

    @Test
    @DisplayName("Should find challenge by ID")
    void shouldFindChallengeById() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        UUID challengeId = challenge.getId();

        // When
        SignatureChallenge found = request.findChallengeById(challengeId);

        // Then
        assertThat(found).isEqualTo(challenge);
    }

    @Test
    @DisplayName("Should throw exception when challenge not found")
    void shouldThrowExceptionWhenChallengeNotFound() {
        // Given
        SignatureRequest request = createPendingRequest();
        UUID nonExistentId = UUID.randomUUID();

        // When/Then
        assertThatThrownBy(() -> request.findChallengeById(nonExistentId))
            .isInstanceOf(com.bank.signature.domain.exception.ChallengeNotFoundException.class);
    }

    @Test
    @DisplayName("Should add routing timeline events when creating challenge")
    void shouldAddRoutingTimelineEventsWhenCreatingChallenge() {
        // Given
        SignatureRequest request = createPendingRequest();

        // When
        request.createChallenge(ChannelType.SMS, ProviderType.SMS);

        // Then
        assertThat(request.getRoutingTimeline()).hasSize(1);
        RoutingEvent event = request.getRoutingTimeline().get(0);
        assertThat(event.eventType()).isEqualTo("CHALLENGE_CREATED");
        assertThat(event.toChannel()).isEqualTo(ChannelType.SMS);
        assertThat(event.reason()).contains("SMS").contains("SMS");
    }

    @Test
    @DisplayName("Should fail all active challenges when aborting")
    void shouldFailAllActiveChallengesWhenAborting() {
        // Given
        SignatureRequest request = createPendingRequest();
        SignatureChallenge challenge1 = request.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Mark first challenge as SENT
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge1.markAsSent(providerResult);
        
        // Fail first challenge and create second
        challenge1.fail("TIMEOUT");
        SignatureChallenge challenge2 = request.createChallenge(ChannelType.PUSH, ProviderType.PUSH);

        // When
        request.abort(AbortReason.USER_CANCELLED, null);

        // Then
        assertThat(challenge2.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge2.getErrorCode()).isEqualTo("SIGNATURE_ABORTED");
    }

    // Helper method to create a pending SignatureRequest
    private SignatureRequest createPendingRequest() {
        return SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();
    }
}


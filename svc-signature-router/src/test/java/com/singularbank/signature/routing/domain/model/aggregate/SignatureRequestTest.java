package com.singularbank.signature.routing.domain.model.aggregate;

import com.singularbank.signature.routing.domain.exception.ChallengeAlreadyActiveException;
import com.singularbank.signature.routing.domain.exception.ChallengeNotFoundException;
import com.singularbank.signature.routing.domain.exception.InvalidStateTransitionException;
import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for SignatureRequest aggregate.
 * Story 10.1: Testing Coverage 75%+
 * 
 * Tests verify:
 * - Aggregate creation and invariants
 * - State transitions (PENDING → SIGNED/ABORTED/EXPIRED)
 * - Challenge management (create, find, complete)
 * - Business rules enforcement
 * 
 * Target: >95% coverage for SignatureRequest.java
 */
@DisplayName("SignatureRequest Aggregate Tests")
class SignatureRequestTest {
    
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(3);
    
    private UUID signatureRequestId;
    private String customerId;
    private TransactionContext transactionContext;
    private Instant now;
    private Instant expiresAt;
    
    @BeforeEach
    void setUp() {
        signatureRequestId = UUID.randomUUID();
        customerId = "pseudo-customer-123";
        transactionContext = new TransactionContext(
            new Money(new BigDecimal("1500.00"), "EUR"),
            "MERCHANT_001",
            "ORDER_12345",
            "Compra en Amazon - Laptop Dell",
            createValidSha256Hash()
        );
        now = Instant.now();
        expiresAt = now.plus(DEFAULT_TTL);
    }
    
    private String createValidSha256Hash() {
        return "a".repeat(64); // Valid SHA256 hash format (64 hex chars)
    }
    
    // ========== Creation Tests ==========
    
    @Test
    @DisplayName("Should create PENDING signature request")
    void shouldCreatePendingSignatureRequest() {
        // Act
        SignatureRequest signatureRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        // Assert
        assertThat(signatureRequest).isNotNull();
        assertThat(signatureRequest.getId()).isEqualTo(signatureRequestId);
        assertThat(signatureRequest.getCustomerId()).isEqualTo(customerId);
        assertThat(signatureRequest.getStatus()).isEqualTo(SignatureStatus.PENDING);
        assertThat(signatureRequest.getChallenges()).isEmpty();
        assertThat(signatureRequest.getRoutingTimeline()).isEmpty();
        assertThat(signatureRequest.getCreatedAt()).isEqualTo(now);
        assertThat(signatureRequest.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(signatureRequest.getSignedAt()).isNull();
        assertThat(signatureRequest.getAbortedAt()).isNull();
    }
    
    @Test
    @DisplayName("Should create signature request with builder")
    void shouldCreateWithBuilder() {
        // Arrange
        RoutingEvent initialRoutingEvent = new RoutingEvent(
            now,
            "ROUTING_EVALUATED",
            null,
            ChannelType.SMS,
            "Routing to SMS channel"
        );
        
        // Act
        SignatureRequest signatureRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>() {{ add(initialRoutingEvent); }})
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        // Assert
        assertThat(signatureRequest.getRoutingTimeline()).hasSize(1);
        assertThat(signatureRequest.getRoutingTimeline().get(0).toChannel()).isEqualTo(ChannelType.SMS);
    }
    
    // ========== Challenge Management Tests ==========
    
    @Test
    @DisplayName("Should create challenge successfully")
    void shouldCreateChallengeSuccessfully() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act
        SignatureChallenge challenge = signatureRequest.createChallenge(
            ChannelType.SMS,
            ProviderType.SMS
        );
        
        // Assert
        assertThat(challenge).isNotNull();
        assertThat(challenge.getId()).isNotNull();
        assertThat(challenge.getChannelType()).isEqualTo(ChannelType.SMS);
        assertThat(challenge.getProvider()).isEqualTo(ProviderType.SMS);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.PENDING);
        assertThat(challenge.getChallengeCode()).isNotBlank();
        assertThat(challenge.getChallengeCode()).hasSize(6); // OTP is 6 digits
        
        // Challenge should be added to aggregate
        assertThat(signatureRequest.getChallenges()).hasSize(1);
        assertThat(signatureRequest.getChallenges().get(0)).isEqualTo(challenge);
        
        // Routing timeline should have CHALLENGE_CREATED event
        assertThat(signatureRequest.getRoutingTimeline()).hasSize(1);
        assertThat(signatureRequest.getRoutingTimeline().get(0).eventType()).isEqualTo("CHALLENGE_CREATED");
    }
    
    @Test
    @DisplayName("Should throw exception when creating challenge with active challenge")
    void shouldThrowExceptionWhenChallengeAlreadyActive() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Act & Assert
        assertThatThrownBy(() -> signatureRequest.createChallenge(ChannelType.PUSH, ProviderType.PUSH))
            .isInstanceOf(ChallengeAlreadyActiveException.class)
            .hasMessageContaining(signatureRequest.getId().toString());
    }
    
    @Test
    @DisplayName("Should allow creating new challenge after first challenge completed")
    void shouldAllowNewChallengeAfterPreviousCompleted() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        SignatureChallenge firstChallenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Mark first challenge as completed
        firstChallenge.markAsSent(ProviderResult.success("proof-123", "verified"));
        firstChallenge.complete(ProviderResult.success("proof-123", "verified"));
        
        // Act - should allow creating a new challenge
        SignatureChallenge secondChallenge = signatureRequest.createChallenge(ChannelType.VOICE, ProviderType.VOICE);
        
        // Assert
        assertThat(secondChallenge).isNotNull();
        assertThat(signatureRequest.getChallenges()).hasSize(2);
    }
    
    @Test
    @DisplayName("Should find challenge by ID")
    void shouldFindChallengeById() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        SignatureChallenge challenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Act
        SignatureChallenge found = signatureRequest.findChallengeById(challenge.getId());
        
        // Assert
        assertThat(found).isEqualTo(challenge);
    }
    
    @Test
    @DisplayName("Should throw exception when challenge not found")
    void shouldThrowExceptionWhenChallengeNotFound() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        UUID nonExistentId = UUID.randomUUID();
        
        // Act & Assert
        assertThatThrownBy(() -> signatureRequest.findChallengeById(nonExistentId))
            .isInstanceOf(ChallengeNotFoundException.class)
            .hasMessageContaining(nonExistentId.toString());
    }
    
    // ========== State Transition Tests ==========
    
    @Test
    @DisplayName("Should transition to SIGNED when challenge completed")
    void shouldTransitionToSignedWhenChallengeCompleted() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        SignatureChallenge challenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        challenge.markAsSent(ProviderResult.success("proof-123", "user-verified"));
        challenge.complete(ProviderResult.success("proof-123", "user-verified"));
        
        // Act
        signatureRequest.completeSignature(challenge);
        
        // Assert
        assertThat(signatureRequest.getStatus()).isEqualTo(SignatureStatus.SIGNED);
        assertThat(signatureRequest.getSignedAt()).isNotNull();
        assertThat(signatureRequest.getSignedAt()).isAfterOrEqualTo(now);
    }
    
    @Test
    @DisplayName("Should throw exception when completing with non-completed challenge")
    void shouldThrowExceptionWhenCompletingWithPendingChallenge() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        SignatureChallenge challenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        // Challenge is still PENDING (not COMPLETED)
        
        // Act & Assert
        assertThatThrownBy(() -> signatureRequest.completeSignature(challenge))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Challenge must be in COMPLETED state");
    }
    
    @Test
    @DisplayName("Should throw exception when completing with challenge from different request")
    void shouldThrowExceptionWhenCompletingWithForeignChallenge() {
        // Arrange
        SignatureRequest signatureRequest1 = createPendingSignatureRequest();
        SignatureRequest signatureRequest2 = SignatureRequest.builder()
            .id(UUID.randomUUID())
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        SignatureChallenge challenge2 = signatureRequest2.createChallenge(ChannelType.SMS, ProviderType.SMS);
        challenge2.markAsSent(ProviderResult.success("proof", "verified"));
        challenge2.complete(ProviderResult.success("proof", "verified"));
        
        // Act & Assert
        assertThatThrownBy(() -> signatureRequest1.completeSignature(challenge2))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("does not belong to");
    }
    
    @Test
    @DisplayName("Should transition to ABORTED when user aborts")
    void shouldTransitionToAbortedWhenUserAborts() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        AbortReason reason = AbortReason.USER_CANCELLED;
        
        // Act
        signatureRequest.abortSignature(reason);
        
        // Assert
        assertThat(signatureRequest.getStatus()).isEqualTo(SignatureStatus.ABORTED);
        assertThat(signatureRequest.getAbortedAt()).isNotNull();
        assertThat(signatureRequest.getAbortReason()).isEqualTo(reason);
    }
    
    @Test
    @DisplayName("Should transition to EXPIRED when TTL exceeded")
    void shouldTransitionToExpiredWhenTTLExceeded() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act
        signatureRequest.markAsExpired();
        
        // Assert
        assertThat(signatureRequest.getStatus()).isEqualTo(SignatureStatus.EXPIRED);
    }
    
    @Test
    @DisplayName("Should throw exception for invalid state transition")
    void shouldThrowExceptionForInvalidStateTransition() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        SignatureChallenge challenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        challenge.markAsSent(ProviderResult.success("proof", "verified"));
        challenge.complete(ProviderResult.success("proof", "verified"));
        
        signatureRequest.completeSignature(challenge);
        // Now status is SIGNED
        
        // Act & Assert - cannot abort a signed request
        assertThatThrownBy(() -> signatureRequest.abortSignature(AbortReason.USER_CANCELLED))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot abort");
    }
    
    // ========== Business Rules Tests ==========
    
    @Test
    @DisplayName("Should check if signature request has expired")
    void shouldCheckIfExpired() {
        // Arrange - create request that expires in the past
        Instant pastExpiry = now.minus(Duration.ofMinutes(5));
        SignatureRequest expiredRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.minus(Duration.ofMinutes(10)))
            .expiresAt(pastExpiry)
            .build();
        
        // Act & Assert
        assertThat(expiredRequest.isExpired()).isTrue();
        
        // Non-expired request
        SignatureRequest validRequest = createPendingSignatureRequest();
        assertThat(validRequest.isExpired()).isFalse();
    }
    
    @Test
    @DisplayName("Should calculate remaining TTL")
    void shouldCalculateRemainingTTL() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act
        Duration remainingTTL = signatureRequest.getRemainingTTL();
        
        // Assert
        assertThat(remainingTTL).isNotNull();
        assertThat(remainingTTL.toMinutes()).isCloseTo(3L, within(1L)); // Close to 3 minutes
    }
    
    @Test
    @DisplayName("Should return negative TTL for expired request")
    void shouldReturnNegativeTTLForExpiredRequest() {
        // Arrange
        Instant pastExpiry = now.minus(Duration.ofMinutes(5));
        SignatureRequest expiredRequest = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.minus(Duration.ofMinutes(10)))
            .expiresAt(pastExpiry)
            .build();
        
        // Act
        Duration remainingTTL = expiredRequest.getRemainingTTL();
        
        // Assert
        assertThat(remainingTTL.isNegative()).isTrue();
    }
    
    @Test
    @DisplayName("Should verify transaction context immutability")
    void shouldVerifyTransactionContextImmutability() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act
        TransactionContext retrievedContext = signatureRequest.getTransactionContext();
        
        // Assert
        assertThat(retrievedContext).isEqualTo(transactionContext);
        assertThat(retrievedContext.hash()).isEqualTo(createValidSha256Hash());
        
        // TransactionContext is a record (immutable by design)
    }
    
    @Test
    @DisplayName("Should record routing events in timeline")
    void shouldRecordRoutingEventsInTimeline() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act - creating a challenge adds a routing event
        signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        
        // Assert
        assertThat(signatureRequest.getRoutingTimeline()).hasSize(1);
        
        RoutingEvent event = signatureRequest.getRoutingTimeline().get(0);
        assertThat(event.eventType()).isEqualTo("CHALLENGE_CREATED");
        assertThat(event.toChannel()).isEqualTo(ChannelType.SMS);
        assertThat(event.reason()).contains("SMS");
    }
    
    @Test
    @DisplayName("Should maintain audit trail of all routing decisions")
    void shouldMaintainAuditTrailOfRoutingDecisions() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act - create multiple challenges (simulating fallback)
        SignatureChallenge smsChallenge = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        smsChallenge.markAsSent(ProviderResult.success("sms-123", "sent"));
        smsChallenge.fail("Twilio API timeout");
        
        SignatureChallenge voiceChallenge = signatureRequest.createChallenge(ChannelType.VOICE, ProviderType.VOICE);
        
        // Assert - routing timeline should have 2 events
        assertThat(signatureRequest.getRoutingTimeline()).hasSize(2);
        assertThat(signatureRequest.getRoutingTimeline().get(0).toChannel()).isEqualTo(ChannelType.SMS);
        assertThat(signatureRequest.getRoutingTimeline().get(1).toChannel()).isEqualTo(ChannelType.VOICE);
    }
    
    // ========== Edge Cases Tests ==========
    
    @Test
    @DisplayName("Should handle multiple challenges with different statuses")
    void shouldHandleMultipleChallengesWithDifferentStatuses() {
        // Arrange
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Act
        SignatureChallenge challenge1 = signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        challenge1.markAsSent(ProviderResult.success("sms-123", "sent"));
        challenge1.fail("Provider timeout");
        
        SignatureChallenge challenge2 = signatureRequest.createChallenge(ChannelType.VOICE, ProviderType.VOICE);
        challenge2.markAsSent(ProviderResult.success("voice-456", "sent"));
        challenge2.complete(ProviderResult.success("proof", "verified"));
        
        // Assert
        assertThat(signatureRequest.getChallenges()).hasSize(2);
        assertThat(signatureRequest.getChallenges().get(0).getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(signatureRequest.getChallenges().get(1).getStatus()).isEqualTo(ChallengeStatus.COMPLETED);
    }
    
    @Test
    @DisplayName("Should preserve creation and expiry timestamps")
    void shouldPreserveCreationAndExpiryTimestamps() {
        // Arrange & Act
        SignatureRequest signatureRequest = createPendingSignatureRequest();
        
        // Assert
        assertThat(signatureRequest.getCreatedAt()).isEqualTo(now);
        assertThat(signatureRequest.getExpiresAt()).isEqualTo(expiresAt);
        
        // Timestamps should not change during lifecycle
        signatureRequest.createChallenge(ChannelType.SMS, ProviderType.SMS);
        assertThat(signatureRequest.getCreatedAt()).isEqualTo(now);
        assertThat(signatureRequest.getExpiresAt()).isEqualTo(expiresAt);
    }
    
    // ========== Helper Methods ==========
    
    private SignatureRequest createPendingSignatureRequest() {
        return SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
    }
}

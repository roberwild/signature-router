package com.bank.signature.domain.model.entity;

import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.model.valueobject.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for SignatureChallenge entity.
 * 
 * Story 10.2: Domain Layer Tests - Testing Coverage >90%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Creating challenge with generated code</li>
 *   <li>Validating code (correct/incorrect)</li>
 *   <li>Expiring challenge by timeout</li>
 *   <li>Marking as SENT/COMPLETED/FAILED</li>
 *   <li>State transitions (valid/invalid)</li>
 * </ul>
 */
@DisplayName("SignatureChallenge Entity Tests")
class SignatureChallengeTest {

    private UUID challengeId;
    private ChannelType channelType;
    private ProviderType provider;
    private String challengeCode;
    private Instant createdAt;
    private Instant expiresAt;

    @BeforeEach
    void setUp() {
        challengeId = UUID.randomUUID();
        channelType = ChannelType.SMS;
        provider = ProviderType.SMS;
        challengeCode = "123456";
        createdAt = Instant.now();
        expiresAt = createdAt.plusSeconds(180); // 3 minutes TTL
    }

    @Test
    @DisplayName("Should create challenge with builder")
    void shouldCreateChallengeWithBuilder() {
        // When
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(channelType)
            .provider(provider)
            .status(ChallengeStatus.PENDING)
            .challengeCode(challengeCode)
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();

        // Then
        assertThat(challenge.getId()).isEqualTo(challengeId);
        assertThat(challenge.getChannelType()).isEqualTo(channelType);
        assertThat(challenge.getProvider()).isEqualTo(provider);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.PENDING);
        assertThat(challenge.getChallengeCode()).isEqualTo(challengeCode);
        assertThat(challenge.getCreatedAt()).isEqualTo(createdAt);
        assertThat(challenge.getExpiresAt()).isEqualTo(expiresAt);
    }

    @Test
    @DisplayName("Should validate correct code")
    void shouldValidateCorrectCode() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();

        // When
        boolean isValid = challenge.validateCode(challengeCode);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should validate incorrect code")
    void shouldValidateIncorrectCode() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();

        // When
        boolean isValid = challenge.validateCode("999999");

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should return false when validating null code")
    void shouldReturnFalseWhenValidatingNullCode() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();

        // When
        boolean isValid = challenge.validateCode(null);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should mark challenge as SENT successfully")
    void shouldMarkChallengeAsSentSuccessfully() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );

        // When
        challenge.markAsSent(providerResult);

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.SENT);
        assertThat(challenge.getSentAt()).isNotNull();
        assertThat(challenge.getProviderProof()).isEqualTo(providerResult);
    }

    @Test
    @DisplayName("Should throw exception when marking non-PENDING challenge as SENT")
    void shouldThrowExceptionWhenMarkingNonPendingChallengeAsSent() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult); // Now status is SENT

        // When/Then
        assertThatThrownBy(() -> challenge.markAsSent(providerResult))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot mark as sent, status is not PENDING");
    }

    @Test
    @DisplayName("Should complete challenge successfully")
    void shouldCompleteChallengeSuccessfully() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult sentResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(sentResult);
        
        ProviderResult completedResult = ProviderResult.success(
            "provider-challenge-id",
            "completion-proof-token"
        );

        // When
        challenge.complete(completedResult);

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.COMPLETED);
        assertThat(challenge.getCompletedAt()).isNotNull();
        assertThat(challenge.getProviderProof()).isEqualTo(completedResult);
    }

    @Test
    @DisplayName("Should throw exception when completing non-SENT challenge")
    void shouldThrowExceptionWhenCompletingNonSentChallenge() {
        // Given
        SignatureChallenge challenge = createPendingChallenge(); // Still PENDING
        ProviderResult completedResult = ProviderResult.success(
            "provider-challenge-id",
            "completion-proof-token"
        );

        // When/Then
        assertThatThrownBy(() -> challenge.complete(completedResult))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot complete challenge, status is not SENT");
    }

    @Test
    @DisplayName("Should fail challenge successfully")
    void shouldFailChallengeSuccessfully() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();

        // When
        challenge.fail("TIMEOUT");

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("TIMEOUT");
    }

    @Test
    @DisplayName("Should fail challenge in SENT status")
    void shouldFailChallengeInSentStatus() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult); // Now status is SENT

        // When
        challenge.fail("WRONG_OTP");

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("WRONG_OTP");
    }

    @Test
    @DisplayName("Should throw exception when failing COMPLETED challenge")
    void shouldThrowExceptionWhenFailingCompletedChallenge() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult sentResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(sentResult);
        challenge.complete(sentResult); // Now status is COMPLETED

        // When/Then
        assertThatThrownBy(() -> challenge.fail("ERROR"))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot fail challenge, status is not PENDING or SENT");
    }

    @Test
    @DisplayName("Should expire challenge successfully")
    void shouldExpireChallengeSuccessfully() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();

        // When
        challenge.expire();

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.EXPIRED);
        assertThat(challenge.getErrorCode()).isEqualTo("TTL_EXCEEDED");
    }

    @Test
    @DisplayName("Should expire challenge in SENT status")
    void shouldExpireChallengeInSentStatus() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(providerResult); // Now status is SENT

        // When
        challenge.expire();

        // Then
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.EXPIRED);
        assertThat(challenge.getErrorCode()).isEqualTo("TTL_EXCEEDED");
    }

    @Test
    @DisplayName("Should throw exception when expiring COMPLETED challenge")
    void shouldThrowExceptionWhenExpiringCompletedChallenge() {
        // Given
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult sentResult = ProviderResult.success(
            "provider-challenge-id",
            "proof-token"
        );
        challenge.markAsSent(sentResult);
        challenge.complete(sentResult); // Now status is COMPLETED

        // When/Then
        assertThatThrownBy(() -> challenge.expire())
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("Cannot expire challenge, status is not PENDING or SENT");
    }

    @Test
    @DisplayName("Should check if challenge is expired")
    void shouldCheckIfChallengeIsExpired() {
        // Given - Challenge expired in the past
        SignatureChallenge expiredChallenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(channelType)
            .provider(provider)
            .status(ChallengeStatus.PENDING)
            .challengeCode(challengeCode)
            .createdAt(createdAt.minusSeconds(200))
            .expiresAt(createdAt.minusSeconds(20)) // Expired 20 seconds ago
            .build();

        // When
        boolean isExpired = expiredChallenge.isExpired();

        // Then
        assertThat(isExpired).isTrue();
    }

    @Test
    @DisplayName("Should check if challenge is not expired")
    void shouldCheckIfChallengeIsNotExpired() {
        // Given
        SignatureChallenge challenge = createPendingChallenge(); // expiresAt is in the future

        // When
        boolean isExpired = challenge.isExpired();

        // Then
        assertThat(isExpired).isFalse();
    }

    // Helper method to create a pending SignatureChallenge
    private SignatureChallenge createPendingChallenge() {
        return SignatureChallenge.builder()
            .id(challengeId)
            .channelType(channelType)
            .provider(provider)
            .status(ChallengeStatus.PENDING)
            .challengeCode(challengeCode)
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();
    }
}


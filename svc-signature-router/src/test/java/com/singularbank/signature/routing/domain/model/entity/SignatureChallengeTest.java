package com.singularbank.signature.routing.domain.model.entity;

import com.singularbank.signature.routing.domain.exception.InvalidStateTransitionException;
import com.singularbank.signature.routing.domain.model.valueobject.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for SignatureChallenge entity.
 * Story 10.1: Testing Coverage 75%+
 * 
 * Tests verify:
 * - Challenge lifecycle (PENDING → SENT → COMPLETED/FAILED/EXPIRED)
 * - Code validation
 * - State transition rules
 * - Expiration logic
 * 
 * Target: >95% coverage for SignatureChallenge.java
 */
@DisplayName("SignatureChallenge Entity Tests")
class SignatureChallengeTest {
    
    private UUID challengeId;
    private String otpCode;
    private Instant now;
    private Instant expiresAt;
    
    @BeforeEach
    void setUp() {
        challengeId = UUID.randomUUID();
        otpCode = "123456";
        now = Instant.now();
        expiresAt = now.plus(Duration.ofMinutes(3));
    }
    
    // ========== Creation Tests ==========
    
    @Test
    @DisplayName("Should create challenge in PENDING status")
    void shouldCreateChallengeInPendingStatus() {
        // Act
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        // Assert
        assertThat(challenge).isNotNull();
        assertThat(challenge.getId()).isEqualTo(challengeId);
        assertThat(challenge.getChannelType()).isEqualTo(ChannelType.SMS);
        assertThat(challenge.getProvider()).isEqualTo(ProviderType.SMS);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.PENDING);
        assertThat(challenge.getChallengeCode()).isEqualTo(otpCode);
        assertThat(challenge.getCreatedAt()).isEqualTo(now);
        assertThat(challenge.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(challenge.getSentAt()).isNull();
        assertThat(challenge.getCompletedAt()).isNull();
        assertThat(challenge.getProviderProof()).isNull();
    }
    
    // ========== State Transition Tests ==========
    
    @Test
    @DisplayName("Should transition from PENDING to SENT")
    void shouldTransitionFromPendingToSent() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success("twilio-msg-123", "sent-successfully");
        
        // Act
        challenge.markAsSent(providerResult);
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.SENT);
        assertThat(challenge.getSentAt()).isNotNull();
        assertThat(challenge.getProviderProof()).isEqualTo(providerResult);
        assertThat(challenge.getProviderProof().providerChallengeId()).isEqualTo("twilio-msg-123");
    }
    
    @Test
    @DisplayName("Should transition from SENT to COMPLETED")
    void shouldTransitionFromSentToCompleted() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge();
        ProviderResult proof = ProviderResult.success("verification-proof-123", "user-verified");
        
        // Act
        challenge.complete(proof);
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.COMPLETED);
        assertThat(challenge.getCompletedAt()).isNotNull();
        assertThat(challenge.getProviderProof()).isEqualTo(proof);
    }
    
    @Test
    @DisplayName("Should transition from SENT to FAILED")
    void shouldTransitionFromSentToFailed() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge();
        String errorCode = "INVALID_CODE";
        
        // Act
        challenge.fail(errorCode);
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo(errorCode);
    }
    
    @Test
    @DisplayName("Should transition from PENDING to FAILED when provider fails")
    void shouldTransitionFromPendingToFailedWhenProviderFails() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        
        // Act
        challenge.fail("PROVIDER_TIMEOUT");
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("PROVIDER_TIMEOUT");
    }
    
    @Test
    @DisplayName("Should mark challenge as expired")
    void shouldMarkChallengeAsExpired() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge();
        
        // Act
        challenge.expire();
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.EXPIRED);
    }
    
    @Test
    @DisplayName("Should throw exception when marking non-PENDING challenge as sent")
    void shouldThrowExceptionWhenMarkingNonPendingAsSent() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge(); // Already SENT
        ProviderResult providerResult = ProviderResult.success("msg-123", "sent");
        
        // Act & Assert
        assertThatThrownBy(() -> challenge.markAsSent(providerResult))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("status is not PENDING");
    }
    
    @Test
    @DisplayName("Should throw exception when completing non-SENT challenge")
    void shouldThrowExceptionWhenCompletingNonSentChallenge() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge(); // Still PENDING
        ProviderResult proof = ProviderResult.success("proof", "verified");
        
        // Act & Assert
        assertThatThrownBy(() -> challenge.complete(proof))
            .isInstanceOf(InvalidStateTransitionException.class)
            .hasMessageContaining("status is not SENT");
    }
    
    // ========== Code Validation Tests ==========
    
    @Test
    @DisplayName("Should validate correct OTP code")
    void shouldValidateCorrectCode() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        
        // Act
        boolean isValid = challenge.validateCode("123456");
        
        // Assert
        assertThat(isValid).isTrue();
    }
    
    @Test
    @DisplayName("Should reject incorrect OTP code")
    void shouldRejectIncorrectCode() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        
        // Act
        boolean isValid = challenge.validateCode("999999");
        
        // Assert
        assertThat(isValid).isFalse();
    }
    
    @Test
    @DisplayName("Should reject null OTP code")
    void shouldRejectNullCode() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        
        // Act
        boolean isValid = challenge.validateCode(null);
        
        // Assert
        assertThat(isValid).isFalse();
    }
    
    @Test
    @DisplayName("Should reject empty OTP code")
    void shouldRejectEmptyCode() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        
        // Act
        boolean isValid = challenge.validateCode("");
        
        // Assert
        assertThat(isValid).isFalse();
    }
    
    @Test
    @DisplayName("Should be case-sensitive in code validation")
    void shouldBeCaseSensitiveInCodeValidation() {
        // Arrange
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode("ABC123")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        // Act & Assert
        assertThat(challenge.validateCode("ABC123")).isTrue();
        assertThat(challenge.validateCode("abc123")).isFalse();
    }
    
    // ========== Expiration Tests ==========
    
    @Test
    @DisplayName("Should detect expired challenge")
    void shouldDetectExpiredChallenge() {
        // Arrange - create challenge that expires in the past
        Instant pastExpiry = now.minus(Duration.ofMinutes(5));
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode(otpCode)
            .createdAt(now.minus(Duration.ofMinutes(10)))
            .sentAt(now.minus(Duration.ofMinutes(9)))
            .expiresAt(pastExpiry)
            .build();
        
        // Act
        boolean isExpired = challenge.isExpired();
        
        // Assert
        assertThat(isExpired).isTrue();
    }
    
    @Test
    @DisplayName("Should detect non-expired challenge")
    void shouldDetectNonExpiredChallenge() {
        // Arrange - create challenge that expires in the future
        SignatureChallenge challenge = createSentChallenge();
        
        // Act
        boolean isExpired = challenge.isExpired();
        
        // Assert
        assertThat(isExpired).isFalse();
    }
    
    // ========== Provider Result Tests ==========
    
    @Test
    @DisplayName("Should store provider proof when sent")
    void shouldStoreProviderProofWhenSent() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success("twilio-msg-456", "sent-via-twilio");
        
        // Act
        challenge.markAsSent(providerResult);
        
        // Assert
        assertThat(challenge.getProviderProof()).isNotNull();
        assertThat(challenge.getProviderProof().providerChallengeId()).isEqualTo("twilio-msg-456");
        assertThat(challenge.getProviderProof().providerProof()).isEqualTo("sent-via-twilio");
        assertThat(challenge.getProviderProof().timestamp()).isNotNull();
    }
    
    @Test
    @DisplayName("Should update provider proof when completed")
    void shouldUpdateProviderProofWhenCompleted() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge();
        ProviderResult initialProof = challenge.getProviderProof();
        ProviderResult completionProof = ProviderResult.success("completion-proof-789", "user-verified-successfully");
        
        // Act
        challenge.complete(completionProof);
        
        // Assert
        assertThat(challenge.getProviderProof()).isNotEqualTo(initialProof);
        assertThat(challenge.getProviderProof()).isEqualTo(completionProof);
        assertThat(challenge.getProviderProof().providerProof()).contains("user-verified");
    }
    
    // ========== Edge Cases Tests ==========
    
    @Test
    @DisplayName("Should handle fail call from SENT status")
    void shouldHandleFailCallFromSentStatus() {
        // Arrange
        SignatureChallenge challenge = createSentChallenge();
        
        // Act - fail once
        challenge.fail("TIMEOUT_ERROR");
        
        // Assert
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(challenge.getErrorCode()).isEqualTo("TIMEOUT_ERROR");
    }
    
    @Test
    @DisplayName("Should preserve timestamps through lifecycle")
    void shouldPreserveTimestampsThroughLifecycle() {
        // Arrange
        SignatureChallenge challenge = createPendingChallenge();
        Instant creationTime = challenge.getCreatedAt();
        Instant expiryTime = challenge.getExpiresAt();
        
        // Act - transition through states
        ProviderResult sentResult = ProviderResult.success("msg-1", "sent");
        challenge.markAsSent(sentResult);
        
        Instant sentTime = challenge.getSentAt();
        
        ProviderResult completeResult = ProviderResult.success("proof-1", "verified");
        challenge.complete(completeResult);
        
        // Assert - timestamps should be preserved
        assertThat(challenge.getCreatedAt()).isEqualTo(creationTime);
        assertThat(challenge.getExpiresAt()).isEqualTo(expiryTime);
        assertThat(challenge.getSentAt()).isEqualTo(sentTime);
        assertThat(challenge.getCompletedAt()).isNotNull();
        assertThat(challenge.getCompletedAt()).isAfterOrEqualTo(sentTime);
    }
    
    @Test
    @DisplayName("Should handle different channel types")
    void shouldHandleDifferentChannelTypes() {
        // Test SMS
        SignatureChallenge smsChallenge = SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode("111111")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        assertThat(smsChallenge.getChannelType()).isEqualTo(ChannelType.SMS);
        
        // Test PUSH
        SignatureChallenge pushChallenge = SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.PUSH)
            .provider(ProviderType.PUSH)
            .status(ChallengeStatus.PENDING)
            .challengeCode("222222")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        assertThat(pushChallenge.getChannelType()).isEqualTo(ChannelType.PUSH);
        
        // Test VOICE
        SignatureChallenge voiceChallenge = SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.VOICE)
            .provider(ProviderType.VOICE)
            .status(ChallengeStatus.PENDING)
            .challengeCode("333333")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        assertThat(voiceChallenge.getChannelType()).isEqualTo(ChannelType.VOICE);
    }
    
    @Test
    @DisplayName("Should handle challenge with null provider proof initially")
    void shouldHandleChallengeWithNullProviderProofInitially() {
        // Arrange & Act
        SignatureChallenge challenge = createPendingChallenge();
        
        // Assert
        assertThat(challenge.getProviderProof()).isNull();
        assertThat(challenge.getSentAt()).isNull();
    }
    
    // ========== Helper Methods ==========
    
    private SignatureChallenge createPendingChallenge() {
        return SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
    }
    
    private SignatureChallenge createSentChallenge() {
        SignatureChallenge challenge = createPendingChallenge();
        ProviderResult providerResult = ProviderResult.success("twilio-msg-123", "sent-successfully");
        challenge.markAsSent(providerResult);
        return challenge;
    }
}

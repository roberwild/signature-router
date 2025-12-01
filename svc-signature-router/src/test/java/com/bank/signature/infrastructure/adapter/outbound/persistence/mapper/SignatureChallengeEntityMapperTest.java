package com.bank.signature.infrastructure.adapter.outbound.persistence.mapper;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureChallengeEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for SignatureChallengeEntityMapper.
 *
 * Tests validate:
 * - Domain → Entity mapping (toEntity)
 * - Entity → Domain mapping (toDomain)
 * - JSONB serialization/deserialization (providerProof)
 * - Timestamp mapping (sentAt, completedAt)
 * - Bidirectional mapping consistency
 * - Null handling
 * - Status transitions
 *
 * Target: >95% coverage for SignatureChallengeEntityMapper.java
 */
@DisplayName("SignatureChallengeEntityMapper Unit Tests")
class SignatureChallengeEntityMapperTest {

    private SignatureChallengeEntityMapper mapper;
    private ObjectMapper objectMapper;

    private UUID challengeId;
    private String otpCode;
    private Instant now;
    private Instant expiresAt;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // Register Java 8 time module
        mapper = new SignatureChallengeEntityMapper(objectMapper);

        challengeId = UUID.randomUUID();
        otpCode = "123456";
        now = Instant.now();
        expiresAt = now.plusSeconds(180); // 3 minutes
    }

    // ========== toEntity() Tests ==========

    @Test
    @DisplayName("Should map PENDING challenge to entity")
    void shouldMapPendingChallengeToEntity() {
        // Arrange
        SignatureChallenge domain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .sentAt(null)
            .completedAt(null)
            .providerProof(null)
            .errorCode(null)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isEqualTo(challengeId);
        assertThat(entity.getChannelType()).isEqualTo("SMS");
        assertThat(entity.getProvider()).isEqualTo("SMS");
        assertThat(entity.getStatus()).isEqualTo("PENDING");
        assertThat(entity.getChallengeCode()).isEqualTo(otpCode);
        assertThat(entity.getCreatedAt()).isEqualTo(now);
        assertThat(entity.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(entity.getSentAt()).isNull();
        assertThat(entity.getCompletedAt()).isNull();
        assertThat(entity.getProviderProofJson()).isNull();
        assertThat(entity.getErrorCode()).isNull();
    }

    @Test
    @DisplayName("Should map SENT challenge with provider proof to entity")
    void shouldMapSentChallengeWithProviderProofToEntity() {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        ProviderResult providerProof = ProviderResult.success("twilio-msg-123", "Message sent successfully");

        SignatureChallenge domain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(null)
            .providerProof(providerProof)
            .errorCode(null)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getStatus()).isEqualTo("SENT");
        assertThat(entity.getSentAt()).isEqualTo(sentAt);
        assertThat(entity.getProviderProofJson()).isNotNull();
        assertThat(entity.getProviderProofJson()).contains("twilio-msg-123");
        assertThat(entity.getProviderProofJson()).contains("Message sent successfully");
        assertThat(entity.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Should map COMPLETED challenge with completedAt to entity")
    void shouldMapCompletedChallengeWithCompletedAtToEntity() {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        Instant completedAt = now.plusSeconds(60);
        ProviderResult providerProof = ProviderResult.success("verification-proof-123", "User verified");

        SignatureChallenge domain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.COMPLETED)
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(completedAt)
            .providerProof(providerProof)
            .errorCode(null)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getStatus()).isEqualTo("COMPLETED");
        assertThat(entity.getSentAt()).isEqualTo(sentAt);
        assertThat(entity.getCompletedAt()).isEqualTo(completedAt);
        assertThat(entity.getProviderProofJson()).isNotNull();
        assertThat(entity.getProviderProofJson()).contains("verification-proof-123");
    }

    @Test
    @DisplayName("Should map FAILED challenge with error code to entity")
    void shouldMapFailedChallengeWithErrorCodeToEntity() {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        String errorCode = "INVALID_CODE";

        SignatureChallenge domain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.FAILED)
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(null)
            .providerProof(null)
            .errorCode(errorCode)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getStatus()).isEqualTo("FAILED");
        assertThat(entity.getErrorCode()).isEqualTo(errorCode);
        assertThat(entity.getProviderProofJson()).isNull();
        assertThat(entity.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Should handle all channel types")
    void shouldHandleAllChannelTypes() {
        // Test SMS
        SignatureChallenge smsChallenge = createBasicChallenge(ChannelType.SMS, ProviderType.SMS);
        SignatureChallengeEntity smsEntity = mapper.toEntity(smsChallenge);
        assertThat(smsEntity.getChannelType()).isEqualTo("SMS");
        assertThat(smsEntity.getProvider()).isEqualTo("SMS");

        // Test PUSH
        SignatureChallenge pushChallenge = createBasicChallenge(ChannelType.PUSH, ProviderType.PUSH);
        SignatureChallengeEntity pushEntity = mapper.toEntity(pushChallenge);
        assertThat(pushEntity.getChannelType()).isEqualTo("PUSH");
        assertThat(pushEntity.getProvider()).isEqualTo("PUSH");

        // Test VOICE
        SignatureChallenge voiceChallenge = createBasicChallenge(ChannelType.VOICE, ProviderType.VOICE);
        SignatureChallengeEntity voiceEntity = mapper.toEntity(voiceChallenge);
        assertThat(voiceEntity.getChannelType()).isEqualTo("VOICE");
        assertThat(voiceEntity.getProvider()).isEqualTo("VOICE");

        // Test BIOMETRIC
        SignatureChallenge biometricChallenge = createBasicChallenge(ChannelType.BIOMETRIC, ProviderType.BIOMETRIC);
        SignatureChallengeEntity biometricEntity = mapper.toEntity(biometricChallenge);
        assertThat(biometricEntity.getChannelType()).isEqualTo("BIOMETRIC");
        assertThat(biometricEntity.getProvider()).isEqualTo("BIOMETRIC");
    }

    // ========== toDomain() Tests ==========

    @Test
    @DisplayName("Should map PENDING entity to domain")
    void shouldMapPendingEntityToDomain() {
        // Arrange
        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("PENDING")
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .sentAt(null)
            .completedAt(null)
            .providerProofJson(null)
            .errorCode(null)
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain).isNotNull();
        assertThat(domain.getId()).isEqualTo(challengeId);
        assertThat(domain.getChannelType()).isEqualTo(ChannelType.SMS);
        assertThat(domain.getProvider()).isEqualTo(ProviderType.SMS);
        assertThat(domain.getStatus()).isEqualTo(ChallengeStatus.PENDING);
        assertThat(domain.getChallengeCode()).isEqualTo(otpCode);
        assertThat(domain.getCreatedAt()).isEqualTo(now);
        assertThat(domain.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(domain.getSentAt()).isNull();
        assertThat(domain.getCompletedAt()).isNull();
        assertThat(domain.getProviderProof()).isNull();
        assertThat(domain.getErrorCode()).isNull();
    }

    @Test
    @DisplayName("Should map SENT entity with provider proof to domain")
    void shouldMapSentEntityWithProviderProofToDomain() throws Exception {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        ProviderResult providerProof = ProviderResult.success("twilio-msg-123", "Message sent successfully");
        String providerProofJson = objectMapper.writeValueAsString(providerProof);

        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("SENT")
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(null)
            .providerProofJson(providerProofJson)
            .errorCode(null)
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getStatus()).isEqualTo(ChallengeStatus.SENT);
        assertThat(domain.getSentAt()).isEqualTo(sentAt);
        assertThat(domain.getProviderProof()).isNotNull();
        assertThat(domain.getProviderProof().providerChallengeId()).isEqualTo("twilio-msg-123");
        assertThat(domain.getProviderProof().providerMessage()).isEqualTo("Message sent successfully");
        assertThat(domain.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Should map COMPLETED entity with completedAt to domain")
    void shouldMapCompletedEntityWithCompletedAtToDomain() throws Exception {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        Instant completedAt = now.plusSeconds(60);
        ProviderResult providerProof = ProviderResult.success("verification-proof-123", "User verified");
        String providerProofJson = objectMapper.writeValueAsString(providerProof);

        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("COMPLETED")
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(completedAt)
            .providerProofJson(providerProofJson)
            .errorCode(null)
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getStatus()).isEqualTo(ChallengeStatus.COMPLETED);
        assertThat(domain.getSentAt()).isEqualTo(sentAt);
        assertThat(domain.getCompletedAt()).isEqualTo(completedAt);
        assertThat(domain.getProviderProof()).isNotNull();
        assertThat(domain.getProviderProof().providerChallengeId()).isEqualTo("verification-proof-123");
    }

    @Test
    @DisplayName("Should map FAILED entity with error code to domain")
    void shouldMapFailedEntityWithErrorCodeToDomain() {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        String errorCode = "INVALID_CODE";

        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("FAILED")
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(null)
            .providerProofJson(null)
            .errorCode(errorCode)
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getStatus()).isEqualTo(ChallengeStatus.FAILED);
        assertThat(domain.getErrorCode()).isEqualTo(errorCode);
        assertThat(domain.getProviderProof()).isNull();
        assertThat(domain.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Should handle null provider proof JSON")
    void shouldHandleNullProviderProofJson() {
        // Arrange
        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("PENDING")
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .providerProofJson(null)
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getProviderProof()).isNull();
    }

    @Test
    @DisplayName("Should handle blank provider proof JSON")
    void shouldHandleBlankProviderProofJson() {
        // Arrange
        SignatureChallengeEntity entity = SignatureChallengeEntity.builder()
            .id(challengeId)
            .channelType("SMS")
            .provider("SMS")
            .status("PENDING")
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .providerProofJson("   ")
            .build();

        // Act
        SignatureChallenge domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getProviderProof()).isNull();
    }

    // ========== Bidirectional Mapping Tests ==========

    @Test
    @DisplayName("Should maintain consistency in bidirectional mapping for PENDING challenge")
    void shouldMaintainConsistencyInBidirectionalMappingForPendingChallenge() {
        // Arrange
        SignatureChallenge originalDomain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(originalDomain);
        SignatureChallenge reconstructedDomain = mapper.toDomain(entity);

        // Assert
        assertThat(reconstructedDomain.getId()).isEqualTo(originalDomain.getId());
        assertThat(reconstructedDomain.getChannelType()).isEqualTo(originalDomain.getChannelType());
        assertThat(reconstructedDomain.getProvider()).isEqualTo(originalDomain.getProvider());
        assertThat(reconstructedDomain.getStatus()).isEqualTo(originalDomain.getStatus());
        assertThat(reconstructedDomain.getChallengeCode()).isEqualTo(originalDomain.getChallengeCode());
        assertThat(reconstructedDomain.getCreatedAt()).isEqualTo(originalDomain.getCreatedAt());
        assertThat(reconstructedDomain.getExpiresAt()).isEqualTo(originalDomain.getExpiresAt());
    }

    @Test
    @DisplayName("Should maintain consistency in bidirectional mapping for COMPLETED challenge")
    void shouldMaintainConsistencyInBidirectionalMappingForCompletedChallenge() {
        // Arrange
        Instant sentAt = now.plusSeconds(1);
        Instant completedAt = now.plusSeconds(60);
        ProviderResult providerProof = ProviderResult.success("proof-123", "verified");

        SignatureChallenge originalDomain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.COMPLETED)
            .challengeCode(otpCode)
            .createdAt(now)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(completedAt)
            .providerProof(providerProof)
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(originalDomain);
        SignatureChallenge reconstructedDomain = mapper.toDomain(entity);

        // Assert - Critical fields should match
        assertThat(reconstructedDomain.getId()).isEqualTo(originalDomain.getId());
        assertThat(reconstructedDomain.getStatus()).isEqualTo(originalDomain.getStatus());
        assertThat(reconstructedDomain.getSentAt()).isEqualTo(originalDomain.getSentAt());
        assertThat(reconstructedDomain.getCompletedAt()).isEqualTo(originalDomain.getCompletedAt());
        assertThat(reconstructedDomain.getProviderProof()).isNotNull();
        assertThat(reconstructedDomain.getProviderProof().providerChallengeId())
            .isEqualTo(originalDomain.getProviderProof().providerChallengeId());
    }

    @Test
    @DisplayName("Should preserve timestamp order in bidirectional mapping")
    void shouldPreserveTimestampOrderInBidirectionalMapping() {
        // Arrange
        Instant createdAt = now;
        Instant sentAt = now.plusSeconds(10);
        Instant completedAt = now.plusSeconds(60);

        SignatureChallenge originalDomain = SignatureChallenge.builder()
            .id(challengeId)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.COMPLETED)
            .challengeCode(otpCode)
            .createdAt(createdAt)
            .sentAt(sentAt)
            .expiresAt(expiresAt)
            .completedAt(completedAt)
            .providerProof(ProviderResult.success("proof", "message"))
            .build();

        // Act
        SignatureChallengeEntity entity = mapper.toEntity(originalDomain);
        SignatureChallenge reconstructedDomain = mapper.toDomain(entity);

        // Assert - Timestamp order should be preserved
        assertThat(reconstructedDomain.getCreatedAt()).isEqualTo(createdAt);
        assertThat(reconstructedDomain.getSentAt()).isEqualTo(sentAt);
        assertThat(reconstructedDomain.getCompletedAt()).isEqualTo(completedAt);
        assertThat(reconstructedDomain.getSentAt()).isAfter(reconstructedDomain.getCreatedAt());
        assertThat(reconstructedDomain.getCompletedAt()).isAfter(reconstructedDomain.getSentAt());
    }

    // ========== Helper Methods ==========

    private SignatureChallenge createBasicChallenge(ChannelType channelType, ProviderType providerType) {
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(channelType)
            .provider(providerType)
            .status(ChallengeStatus.PENDING)
            .challengeCode(otpCode)
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
    }
}

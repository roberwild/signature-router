package com.bank.signature.infrastructure.adapter.outbound.persistence.mapper;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureChallengeEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureRequestEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for SignatureRequestEntityMapper.
 *
 * Tests validate:
 * - Domain → Entity mapping (toEntity)
 * - Entity → Domain mapping (toDomain)
 * - JSONB serialization/deserialization (routingTimeline, transactionContext)
 * - Timestamp mapping (signedAt, abortedAt, completedAt)
 * - Bidirectional mapping consistency
 * - Null handling
 * - Edge cases (empty lists, null optional fields)
 *
 * Target: >95% coverage for SignatureRequestEntityMapper.java
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SignatureRequestEntityMapper Unit Tests")
class SignatureRequestEntityMapperTest {

    private SignatureRequestEntityMapper mapper;

    @Mock
    private SignatureChallengeEntityMapper challengeMapper;

    private ObjectMapper objectMapper;

    private UUID signatureRequestId;
    private String customerId;
    private TransactionContext transactionContext;
    private Instant now;
    private Instant expiresAt;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // Register Java 8 time module
        mapper = new SignatureRequestEntityMapper(objectMapper, challengeMapper);

        signatureRequestId = UUID.randomUUID();
        customerId = "pseudo-customer-123";
        now = Instant.now();
        expiresAt = now.plusSeconds(180); // 3 minutes

        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "a".repeat(64); // Valid SHA256 hash
        transactionContext = new TransactionContext(
            amount,
            "merchant-123",
            "order-456",
            "Test transaction",
            hash
        );
    }

    // ========== toEntity() Tests ==========

    @Test
    @DisplayName("Should map domain to entity with all fields")
    void shouldMapDomainToEntityWithAllFields() throws Exception {
        // Arrange
        List<RoutingEvent> routingTimeline = createRoutingTimeline();
        Instant signedAt = now.plusSeconds(60);

        SignatureRequest domain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.SIGNED)
            .challenges(new ArrayList<>())
            .routingTimeline(routingTimeline)
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(signedAt)
            .abortedAt(null)
            .abortReason(null)
            .build();

        // Act
        SignatureRequestEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isEqualTo(signatureRequestId);
        assertThat(entity.getCustomerId()).isEqualTo(customerId);
        assertThat(entity.getStatus()).isEqualTo("SIGNED");
        assertThat(entity.getCreatedAt()).isEqualTo(now);
        assertThat(entity.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(entity.getSignedAt()).isEqualTo(signedAt);
        assertThat(entity.getAbortedAt()).isNull();
        assertThat(entity.getAbortReason()).isNull();

        // Validate JSONB serialization
        assertThat(entity.getTransactionContextJson()).isNotNull();
        assertThat(entity.getTransactionContextJson()).contains("\"amount\"");
        assertThat(entity.getTransactionContextJson()).contains("100.00");

        assertThat(entity.getRoutingTimelineJson()).isNotNull();
        assertThat(entity.getRoutingTimelineJson()).contains("CHALLENGE_CREATED");
        assertThat(entity.getRoutingTimelineJson()).contains("ROUTING_EVALUATED");
    }

    @Test
    @DisplayName("Should map domain to entity with aborted status")
    void shouldMapDomainToEntityWithAbortedStatus() throws Exception {
        // Arrange
        Instant abortedAt = now.plusSeconds(30);

        SignatureRequest domain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.ABORTED)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(null)
            .abortedAt(abortedAt)
            .abortReason(AbortReason.USER_CANCELLED)
            .build();

        // Act
        SignatureRequestEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getStatus()).isEqualTo("ABORTED");
        assertThat(entity.getAbortedAt()).isEqualTo(abortedAt);
        assertThat(entity.getAbortReason()).isEqualTo("USER_CANCELLED");
        assertThat(entity.getSignedAt()).isNull();
    }

    @Test
    @DisplayName("Should serialize empty routing timeline")
    void shouldSerializeEmptyRoutingTimeline() throws Exception {
        // Arrange
        SignatureRequest domain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        // Act
        SignatureRequestEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getRoutingTimelineJson()).isNotNull();
        assertThat(entity.getRoutingTimelineJson()).isEqualTo("[]");
    }

    @Test
    @DisplayName("Should map challenges with bidirectional relationship")
    void shouldMapChallengesWithBidirectionalRelationship() throws Exception {
        // Arrange
        SignatureChallenge challenge = createDomainChallenge();
        SignatureChallengeEntity challengeEntity = createChallengeEntity();

        when(challengeMapper.toEntity(any(SignatureChallenge.class)))
            .thenReturn(challengeEntity);

        SignatureRequest domain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(List.of(challenge))
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        // Act
        SignatureRequestEntity entity = mapper.toEntity(domain);

        // Assert
        assertThat(entity.getChallenges()).hasSize(1);
        assertThat(entity.getChallenges().get(0).getSignatureRequest()).isEqualTo(entity);
    }

    // ========== toDomain() Tests ==========

    @Test
    @DisplayName("Should map entity to domain with all fields")
    void shouldMapEntityToDomainWithAllFields() throws Exception {
        // Arrange
        Instant signedAt = now.plusSeconds(60);
        String routingTimelineJson = objectMapper.writeValueAsString(createRoutingTimeline());
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);

        SignatureRequestEntity entity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("SIGNED")
            .routingTimelineJson(routingTimelineJson)
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(signedAt)
            .abortedAt(null)
            .abortReason(null)
            .build();

        // Act
        SignatureRequest domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain).isNotNull();
        assertThat(domain.getId()).isEqualTo(signatureRequestId);
        assertThat(domain.getCustomerId()).isEqualTo(customerId);
        assertThat(domain.getStatus()).isEqualTo(SignatureStatus.SIGNED);
        assertThat(domain.getCreatedAt()).isEqualTo(now);
        assertThat(domain.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(domain.getSignedAt()).isEqualTo(signedAt);
        assertThat(domain.getAbortedAt()).isNull();
        assertThat(domain.getAbortReason()).isNull();

        // Validate deserialized transaction context
        assertThat(domain.getTransactionContext()).isNotNull();
        assertThat(domain.getTransactionContext().amount().value()).isEqualByComparingTo("100.00");
        assertThat(domain.getTransactionContext().merchantId()).isEqualTo("merchant-123");

        // Validate deserialized routing timeline
        assertThat(domain.getRoutingTimeline()).hasSize(2);
        assertThat(domain.getRoutingTimeline().get(0).eventType()).isEqualTo("ROUTING_EVALUATED");
        assertThat(domain.getRoutingTimeline().get(1).eventType()).isEqualTo("CHALLENGE_CREATED");
    }

    @Test
    @DisplayName("Should map entity to domain with aborted status")
    void shouldMapEntityToDomainWithAbortedStatus() throws Exception {
        // Arrange
        Instant abortedAt = now.plusSeconds(30);
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);

        SignatureRequestEntity entity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("ABORTED")
            .routingTimelineJson("[]")
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(null)
            .abortedAt(abortedAt)
            .abortReason("USER_CANCELLED")
            .build();

        // Act
        SignatureRequest domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getStatus()).isEqualTo(SignatureStatus.ABORTED);
        assertThat(domain.getAbortedAt()).isEqualTo(abortedAt);
        assertThat(domain.getAbortReason()).isEqualTo(AbortReason.USER_CANCELLED);
        assertThat(domain.getSignedAt()).isNull();
    }

    @Test
    @DisplayName("Should deserialize empty routing timeline")
    void shouldDeserializeEmptyRoutingTimeline() throws Exception {
        // Arrange
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);

        SignatureRequestEntity entity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("PENDING")
            .routingTimelineJson("[]")
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        // Act
        SignatureRequest domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getRoutingTimeline()).isNotNull();
        assertThat(domain.getRoutingTimeline()).isEmpty();
    }

    @Test
    @DisplayName("Should handle null abort reason")
    void shouldHandleNullAbortReason() throws Exception {
        // Arrange
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);

        SignatureRequestEntity entity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("PENDING")
            .routingTimelineJson("[]")
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .abortReason(null)
            .build();

        // Act
        SignatureRequest domain = mapper.toDomain(entity);

        // Assert
        assertThat(domain.getAbortReason()).isNull();
    }

    // ========== updateEntity() Tests ==========

    @Test
    @DisplayName("Should update entity mutable fields")
    void shouldUpdateEntityMutableFields() throws Exception {
        // Arrange
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);
        SignatureRequestEntity existingEntity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("PENDING")
            .routingTimelineJson("[]")
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        List<RoutingEvent> updatedTimeline = createRoutingTimeline();
        Instant signedAt = now.plusSeconds(60);
        SignatureRequest updatedDomain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.SIGNED)
            .challenges(new ArrayList<>())
            .routingTimeline(updatedTimeline)
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(signedAt)
            .build();

        // Act
        mapper.updateEntity(updatedDomain, existingEntity);

        // Assert
        assertThat(existingEntity.getStatus()).isEqualTo("SIGNED");
        assertThat(existingEntity.getSignedAt()).isEqualTo(signedAt);
        assertThat(existingEntity.getRoutingTimelineJson()).contains("CHALLENGE_CREATED");

        // Immutable fields should not change
        assertThat(existingEntity.getId()).isEqualTo(signatureRequestId);
        assertThat(existingEntity.getCreatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Should update entity with abort information")
    void shouldUpdateEntityWithAbortInformation() throws Exception {
        // Arrange
        String transactionContextJson = objectMapper.writeValueAsString(transactionContext);
        SignatureRequestEntity existingEntity = SignatureRequestEntity.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContextJson(transactionContextJson)
            .status("PENDING")
            .routingTimelineJson("[]")
            .challenges(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();

        Instant abortedAt = now.plusSeconds(30);
        SignatureRequest abortedDomain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.ABORTED)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(expiresAt)
            .abortedAt(abortedAt)
            .abortReason(AbortReason.TIMEOUT)
            .build();

        // Act
        mapper.updateEntity(abortedDomain, existingEntity);

        // Assert
        assertThat(existingEntity.getStatus()).isEqualTo("ABORTED");
        assertThat(existingEntity.getAbortedAt()).isEqualTo(abortedAt);
        assertThat(existingEntity.getAbortReason()).isEqualTo("TIMEOUT");
    }

    // ========== Bidirectional Mapping Tests ==========

    @Test
    @DisplayName("Should maintain consistency in bidirectional mapping")
    void shouldMaintainConsistencyInBidirectionalMapping() throws Exception {
        // Arrange
        List<RoutingEvent> routingTimeline = createRoutingTimeline();
        Instant signedAt = now.plusSeconds(60);

        SignatureRequest originalDomain = SignatureRequest.builder()
            .id(signatureRequestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.SIGNED)
            .challenges(new ArrayList<>())
            .routingTimeline(routingTimeline)
            .createdAt(now)
            .expiresAt(expiresAt)
            .signedAt(signedAt)
            .build();

        // Act
        SignatureRequestEntity entity = mapper.toEntity(originalDomain);
        SignatureRequest reconstructedDomain = mapper.toDomain(entity);

        // Assert - Critical fields should match
        assertThat(reconstructedDomain.getId()).isEqualTo(originalDomain.getId());
        assertThat(reconstructedDomain.getCustomerId()).isEqualTo(originalDomain.getCustomerId());
        assertThat(reconstructedDomain.getStatus()).isEqualTo(originalDomain.getStatus());
        assertThat(reconstructedDomain.getSignedAt()).isEqualTo(originalDomain.getSignedAt());
        assertThat(reconstructedDomain.getRoutingTimeline()).hasSize(originalDomain.getRoutingTimeline().size());
        assertThat(reconstructedDomain.getTransactionContext().amount().value())
            .isEqualByComparingTo(originalDomain.getTransactionContext().amount().value());
    }

    // ========== Helper Methods ==========

    private List<RoutingEvent> createRoutingTimeline() {
        List<RoutingEvent> timeline = new ArrayList<>();
        timeline.add(new RoutingEvent(
            now,
            "ROUTING_EVALUATED",
            null,
            ChannelType.SMS,
            "Routing rule matched: High value transaction"
        ));
        timeline.add(new RoutingEvent(
            now.plusSeconds(1),
            "CHALLENGE_CREATED",
            null,
            ChannelType.SMS,
            "Challenge created for SMS channel"
        ));
        return timeline;
    }

    private SignatureChallenge createDomainChallenge() {
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode("123456")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
    }

    private SignatureChallengeEntity createChallengeEntity() {
        return SignatureChallengeEntity.builder()
            .id(UUID.randomUUID())
            .channelType("SMS")
            .provider("SMS")
            .status("PENDING")
            .challengeCode("123456")
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
    }
}

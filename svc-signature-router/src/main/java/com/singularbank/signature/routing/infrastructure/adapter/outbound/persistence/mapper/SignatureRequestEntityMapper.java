package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper;

import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.RoutingEvent;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import com.singularbank.signature.routing.domain.model.valueobject.TransactionContext;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.SignatureRequestEntity;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.SignatureChallengeEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for bidirectional conversion between SignatureRequest domain aggregate and JPA entity.
 * 
 * <p><b>Mapping Strategy:</b></p>
 * <ul>
 *   <li>Domain SignatureRequest ↔ JPA SignatureRequestEntity</li>
 *   <li>Value Objects (TransactionContext, List&lt;RoutingEvent&gt;) ↔ JSON String (Jackson)</li>
 *   <li>Enums (SignatureStatus) ↔ String</li>
 *   <li>Collections (List&lt;SignatureChallenge&gt;) ↔ List&lt;SignatureChallengeEntity&gt;</li>
 * </ul>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // Domain → Entity (for save)
 * SignatureRequest domain = SignatureRequest.builder()...build();
 * SignatureRequestEntity entity = mapper.toEntity(domain);
 * 
 * // Entity → Domain (for retrieval)
 * SignatureRequestEntity entity = jpaRepository.findById(id);
 * SignatureRequest domain = mapper.toDomain(entity);
 * 
 * // Update existing entity (for updates)
 * SignatureRequest updatedDomain = ...;
 * SignatureRequestEntity existingEntity = ...;
 * mapper.updateEntity(updatedDomain, existingEntity);
 * }</pre>
 * 
 * @since Story 1.6
 */
@Component
public class SignatureRequestEntityMapper {
    
    private final ObjectMapper objectMapper;
    private final SignatureChallengeEntityMapper challengeMapper;
    
    public SignatureRequestEntityMapper(
            ObjectMapper objectMapper,
            SignatureChallengeEntityMapper challengeMapper) {
        this.objectMapper = objectMapper;
        this.challengeMapper = challengeMapper;
    }
    
    /**
     * Map domain aggregate to JPA entity.
     * 
     * <p><b>Serialization:</b></p>
     * <ul>
     *   <li>TransactionContext → JSON String (transactionContextJson)</li>
     *   <li>List&lt;RoutingEvent&gt; → JSON String (routingTimelineJson)</li>
     *   <li>SignatureStatus enum → String</li>
     * </ul>
     * 
     * @param domain Domain SignatureRequest aggregate
     * @return JPA SignatureRequestEntity
     * @throws RuntimeException if JSON serialization fails
     */
    public SignatureRequestEntity toEntity(SignatureRequest domain) {
        try {
            SignatureRequestEntity entity = SignatureRequestEntity.builder()
                .id(domain.getId())
                .customerId(domain.getCustomerId())
                .transactionContextJson(objectMapper.writeValueAsString(domain.getTransactionContext()))
                .status(domain.getStatus().name())
                .routingTimelineJson(objectMapper.writeValueAsString(domain.getRoutingTimeline()))
                .createdAt(domain.getCreatedAt())
                .expiresAt(domain.getExpiresAt())
                .signedAt(domain.getSignedAt())
                .abortedAt(domain.getAbortedAt())  // Story 2.12
                .abortReason(domain.getAbortReason() != null ? domain.getAbortReason().name() : null)  // Story 2.12
                .build();
            
            // Map challenges and maintain bidirectional relationship
            List<SignatureChallengeEntity> challengeEntities = domain.getChallenges().stream()
                .map(challengeMapper::toEntity)
                .peek(ce -> ce.setSignatureRequest(entity))
                .collect(Collectors.toList());
            entity.setChallenges(challengeEntities);
            
            return entity;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize SignatureRequest to entity: " + e.getMessage(), e);
        }
    }
    
    /**
     * Map JPA entity to domain aggregate.
     * 
     * <p><b>Deserialization:</b></p>
     * <ul>
     *   <li>JSON String (transactionContextJson) → TransactionContext</li>
     *   <li>JSON String (routingTimelineJson) → List&lt;RoutingEvent&gt;</li>
     *   <li>String → SignatureStatus enum</li>
     * </ul>
     * 
     * @param entity JPA SignatureRequestEntity
     * @return Domain SignatureRequest aggregate
     * @throws RuntimeException if JSON deserialization fails
     */
    public SignatureRequest toDomain(SignatureRequestEntity entity) {
        try {
            TransactionContext transactionContext = objectMapper.readValue(
                entity.getTransactionContextJson(), TransactionContext.class);

            List<RoutingEvent> routingTimeline = objectMapper.readValue(
                entity.getRoutingTimelineJson(), new TypeReference<List<RoutingEvent>>() {});

            List<SignatureChallenge> challenges = entity.getChallenges().stream()
                .map(challengeMapper::toDomain)
                .collect(Collectors.toList());

            return SignatureRequest.builder()
                .id(entity.getId())
                .customerId(entity.getCustomerId())
                .transactionContext(transactionContext)
                .status(SignatureStatus.valueOf(entity.getStatus()))
                .challenges(challenges)
                .routingTimeline(routingTimeline)
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .signedAt(entity.getSignedAt())
                .abortedAt(entity.getAbortedAt())  // Story 2.12
                .abortReason(entity.getAbortReason() != null ?
                    com.singularbank.signature.routing.domain.model.valueobject.AbortReason.valueOf(entity.getAbortReason()) : null)  // Story 2.12
                .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize SignatureRequestEntity to domain: " + e.getMessage(), e);
        }
    }
    
    /**
     * Update existing JPA entity from domain aggregate.
     * 
     * <p><b>Use Case:</b> Efficient updates without recreating entire entity.
     * Only mutable fields are updated: status, routingTimeline, signedAt, challenges.</p>
     * 
     * <p><b>Note:</b> Immutable fields (id, customerId, transactionContext, createdAt, expiresAt)
     * are NOT updated.</p>
     * 
     * @param domain Domain SignatureRequest with updated values
     * @param entity Existing JPA SignatureRequestEntity to update
     * @throws RuntimeException if JSON serialization fails
     */
    public void updateEntity(SignatureRequest domain, SignatureRequestEntity entity) {
        try {
            // Update mutable fields
            entity.setStatus(domain.getStatus().name());
            entity.setRoutingTimelineJson(objectMapper.writeValueAsString(domain.getRoutingTimeline()));
            entity.setSignedAt(domain.getSignedAt());
            entity.setAbortedAt(domain.getAbortedAt());  // Story 2.12
            entity.setAbortReason(domain.getAbortReason() != null ? domain.getAbortReason().name() : null);  // Story 2.12
            
            // Update challenges (clear and re-add to handle additions/removals)
            entity.getChallenges().clear();
            List<SignatureChallengeEntity> challengeEntities = domain.getChallenges().stream()
                .map(challengeMapper::toEntity)
                .peek(ce -> ce.setSignatureRequest(entity))
                .collect(Collectors.toList());
            entity.getChallenges().addAll(challengeEntities);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to update entity from domain: " + e.getMessage(), e);
        }
    }
}


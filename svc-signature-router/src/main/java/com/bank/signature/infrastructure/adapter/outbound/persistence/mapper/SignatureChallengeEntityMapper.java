package com.bank.signature.infrastructure.adapter.outbound.persistence.mapper;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChallengeStatus;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureChallengeEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Mapper for bidirectional conversion between SignatureChallenge domain entity and JPA entity.
 * 
 * <p><b>Mapping Strategy:</b></p>
 * <ul>
 *   <li>Domain SignatureChallenge ↔ JPA SignatureChallengeEntity</li>
 *   <li>Value Object ProviderResult ↔ JSON String (Jackson)</li>
 *   <li>Enums (ChallengeStatus, ChannelType, ProviderType) ↔ String</li>
 * </ul>
 * 
 * @since Story 1.6
 */
@Component
public class SignatureChallengeEntityMapper {
    
    private final ObjectMapper objectMapper;
    
    public SignatureChallengeEntityMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    /**
     * Map domain entity to JPA entity.
     * 
     * @param domain Domain SignatureChallenge
     * @return JPA SignatureChallengeEntity
     */
    public SignatureChallengeEntity toEntity(SignatureChallenge domain) {
        try {
            String providerProofJson = null;
            if (domain.getProviderProof() != null) {
                providerProofJson = objectMapper.writeValueAsString(domain.getProviderProof());
            }
            
            return SignatureChallengeEntity.builder()
                .id(domain.getId())
                .channelType(domain.getChannelType().name())
                .provider(domain.getProvider().name())
                .status(domain.getStatus().name())
                .challengeCode(domain.getChallengeCode())
                .sentAt(domain.getSentAt())
                .expiresAt(domain.getExpiresAt())
                .completedAt(domain.getCompletedAt())
                .providerProofJson(providerProofJson)
                .errorCode(domain.getErrorCode())
                .createdAt(domain.getCreatedAt())
                .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize SignatureChallenge to entity", e);
        }
    }
    
    /**
     * Map JPA entity to domain entity.
     * 
     * @param entity JPA SignatureChallengeEntity
     * @return Domain SignatureChallenge
     */
    public SignatureChallenge toDomain(SignatureChallengeEntity entity) {
        try {
            ProviderResult providerProof = null;
            if (entity.getProviderProofJson() != null && !entity.getProviderProofJson().isBlank()) {
                providerProof = objectMapper.readValue(entity.getProviderProofJson(), ProviderResult.class);
            }
            
            return SignatureChallenge.builder()
                .id(entity.getId())
                .channelType(ChannelType.valueOf(entity.getChannelType()))
                .provider(ProviderType.valueOf(entity.getProvider()))
                .status(ChallengeStatus.valueOf(entity.getStatus()))
                .challengeCode(entity.getChallengeCode())
                .createdAt(entity.getCreatedAt())
                .sentAt(entity.getSentAt())
                .expiresAt(entity.getExpiresAt())
                .completedAt(entity.getCompletedAt())
                .providerProof(providerProof)
                .errorCode(entity.getErrorCode())
                .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize SignatureChallengeEntity to domain", e);
        }
    }
}


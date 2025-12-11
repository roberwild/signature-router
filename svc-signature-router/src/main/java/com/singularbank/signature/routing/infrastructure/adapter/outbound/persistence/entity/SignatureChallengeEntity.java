package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for signature_challenge table.
 * 
 * <p><b>Mapping Strategy:</b> JPA Entity ↔ Domain Entity (SignatureChallenge) via mapper.</p>
 * 
 * <p><b>JSONB Columns:</b></p>
 * <ul>
 *   <li>providerProofJson: Serialized ProviderResult (Jackson)</li>
 * </ul>
 * 
 * <p><b>Relationships:</b></p>
 * <ul>
 *   <li>ManyToOne: signatureRequest (back-reference to parent)</li>
 * </ul>
 * 
 * <p><b>Note:</b> This is an INFRASTRUCTURE component. Domain layer should NEVER
 * import this class. Use SignatureChallengeEntityMapper for conversions.</p>
 * 
 * @since Story 1.6
 */
@Entity
@Table(name = "signature_challenge", indexes = {
    @Index(name = "idx_signature_challenge_request_id", columnList = "signature_request_id"),
    @Index(name = "idx_signature_challenge_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureChallengeEntity {
    
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    /**
     * Back-reference to parent SignatureRequestEntity.
     * 
     * <p><b>Cascade:</b> None from child side (parent controls lifecycle)</p>
     * <p><b>Fetch:</b> LAZY - parent loaded only when accessed</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signature_request_id", nullable = false)
    private SignatureRequestEntity signatureRequest;
    
    /**
     * ChannelType enum value as String.
     * 
     * <p>Mapper converts: ChannelType enum (domain) ↔ String (JPA entity)</p>
     */
    @Column(name = "channel_type", length = 20, nullable = false)
    private String channelType;
    
    /**
     * ProviderType enum value as String.
     * 
     * <p>Mapper converts: ProviderType enum (domain) ↔ String (JPA entity)</p>
     */
    @Column(name = "provider", length = 50, nullable = false)
    private String provider;
    
    /**
     * ChallengeStatus enum value as String.
     * 
     * <p>Mapper converts: ChallengeStatus enum (domain) ↔ String (JPA entity)</p>
     */
    @Column(name = "status", length = 20, nullable = false)
    private String status;
    
    /**
     * OTP code for this challenge (Story 2.5).
     * Encrypted at rest in production.
     */
    @Column(name = "challenge_code", length = 10, nullable = false)
    private String challengeCode;
    
    @Column(name = "sent_at")
    private Instant sentAt;
    
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    /**
     * Serialized ProviderResult as JSONB.
     * 
     * <p>Mapper converts: ProviderResult (domain VO) ↔ JSON String (JPA entity)</p>
     * <p><b>Non-Repudiation:</b> Contains cryptographic proof from provider.</p>
     */
    @Type(JsonBinaryType.class)
    @Column(name = "provider_proof", columnDefinition = "jsonb")
    private String providerProofJson;
    
    @Column(name = "error_code", length = 100)
    private String errorCode;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}


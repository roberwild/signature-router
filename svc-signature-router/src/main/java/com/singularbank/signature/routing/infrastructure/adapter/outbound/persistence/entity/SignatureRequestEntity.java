package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA entity for signature_request table.
 * 
 * <p><b>Mapping Strategy:</b> JPA Entity ↔ Domain Aggregate (SignatureRequest) via mapper.</p>
 * 
 * <p><b>JSONB Columns:</b></p>
 * <ul>
 *   <li>transactionContextJson: Serialized TransactionContext (Jackson)</li>
 *   <li>routingTimelineJson: Serialized List&lt;RoutingEvent&gt; (Jackson)</li>
 * </ul>
 * 
 * <p><b>Relationships:</b></p>
 * <ul>
 *   <li>OneToMany: challenges (cascade ALL, orphanRemoval true)</li>
 * </ul>
 * 
 * <p><b>Note:</b> This is an INFRASTRUCTURE component. Domain layer should NEVER
 * import this class. Use SignatureRequestEntityMapper for conversions.</p>
 * 
 * @since Story 1.6
 */
@Entity
@Table(name = "signature_request", indexes = {
    @Index(name = "idx_signature_request_customer_id", columnList = "customer_id"),
    @Index(name = "idx_signature_request_status", columnList = "status"),
    @Index(name = "idx_signature_request_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureRequestEntity {
    
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    @Column(name = "customer_id", nullable = false, length = 255)
    private String customerId;
    
    /**
     * Serialized TransactionContext as JSONB.
     * 
     * <p>Mapper converts: TransactionContext (domain VO) ↔ JSON String (JPA entity)</p>
     */
    @Type(JsonBinaryType.class)
    @Column(name = "transaction_context", columnDefinition = "jsonb", nullable = false)
    private String transactionContextJson;
    
    /**
     * SignatureStatus enum value as String.
     * 
     * <p>Mapper converts: SignatureStatus enum (domain) ↔ String (JPA entity)</p>
     */
    @Column(name = "status", length = 20, nullable = false)
    private String status;
    
    /**
     * Associated challenges (one-to-many relationship).
     * 
     * <p><b>Cascade:</b> ALL - challenges persist/update/delete with parent</p>
     * <p><b>orphanRemoval:</b> true - challenges removed from list are deleted from DB</p>
     * <p><b>Fetch:</b> LAZY - challenges loaded only when accessed (performance)</p>
     */
    @OneToMany(mappedBy = "signatureRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SignatureChallengeEntity> challenges = new ArrayList<>();
    
    /**
     * Serialized List&lt;RoutingEvent&gt; as JSONB.
     *
     * <p>Mapper converts: List&lt;RoutingEvent&gt; (domain VOs) ↔ JSON String (JPA entity)</p>
     */
    @Type(JsonBinaryType.class)
    @Column(name = "routing_timeline", columnDefinition = "jsonb", nullable = false)
    private String routingTimelineJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "signed_at")
    private Instant signedAt;
    
    @Column(name = "aborted_at")
    private Instant abortedAt;  // Story 2.12: Timestamp when aborted
    
    @Column(name = "abort_reason", length = 50)
    private String abortReason;  // Story 2.12: Reason for abort (enum as String)
    
    /**
     * Helper method to add challenge and maintain bidirectional relationship.
     * 
     * @param challenge Challenge entity to add
     */
    public void addChallenge(SignatureChallengeEntity challenge) {
        challenges.add(challenge);
        challenge.setSignatureRequest(this);
    }
    
    /**
     * Helper method to remove challenge and maintain bidirectional relationship.
     * 
     * @param challenge Challenge entity to remove
     */
    public void removeChallenge(SignatureChallengeEntity challenge) {
        challenges.remove(challenge);
        challenge.setSignatureRequest(null);
    }
}


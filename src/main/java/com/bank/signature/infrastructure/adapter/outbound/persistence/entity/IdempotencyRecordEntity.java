package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import com.bank.signature.domain.model.entity.IdempotencyRecord;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * JPA entity for idempotency_record table.
 * 
 * <p><b>Hexagonal Architecture:</b> Infrastructure adapter entity.
 * Maps between domain model (IdempotencyRecord) and database table.</p>
 * 
 * @since Story 10.5
 */
@Entity
@Table(name = "idempotency_record", indexes = {
    @Index(name = "idx_idempotency_key", columnList = "idempotency_key"),
    @Index(name = "idx_idempotency_expires_at", columnList = "expires_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyRecordEntity {
    
    @Id
    @Column(name = "idempotency_key", length = 255, nullable = false)
    private String idempotencyKey;
    
    @Column(name = "request_hash", length = 64, nullable = false)
    private String requestHash;
    
    @Column(name = "status_code", nullable = false)
    private Integer statusCode;
    
    @Column(name = "response_body", columnDefinition = "TEXT", nullable = false)
    private String responseBody;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
    
    /**
     * Convert domain model to JPA entity.
     * 
     * @param domain Domain model
     * @return JPA entity
     */
    public static IdempotencyRecordEntity fromDomain(IdempotencyRecord domain) {
        return IdempotencyRecordEntity.builder()
            .idempotencyKey(domain.getIdempotencyKey())
            .requestHash(domain.getRequestHash())
            .statusCode(domain.getStatusCode())
            .responseBody(domain.getResponseBody())
            .createdAt(domain.getCreatedAt())
            .expiresAt(domain.getExpiresAt())
            .build();
    }
    
    /**
     * Convert JPA entity to domain model.
     * 
     * @return Domain model
     */
    public IdempotencyRecord toDomain() {
        // Generate UUID for domain model (not stored in DB, idempotency_key is PK)
        return IdempotencyRecord.builder()
            .id(java.util.UUID.randomUUID()) // Domain model needs UUID, but DB uses idempotency_key as PK
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(statusCode)
            .responseBody(responseBody)
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();
    }
}


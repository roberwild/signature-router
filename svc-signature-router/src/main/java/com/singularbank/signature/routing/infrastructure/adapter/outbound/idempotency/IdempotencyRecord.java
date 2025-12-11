package com.singularbank.signature.routing.infrastructure.adapter.outbound.idempotency;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * JPA entity for idempotency_record table.
 * Story 2.10: Idempotency Enforcement
 * 
 * Stores idempotency keys and responses for 24h to prevent duplicate requests.
 */
@Entity
@Table(name = "idempotency_record")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyRecord {
    
    @Id
    @Column(name = "idempotency_key", length = 255, nullable = false)
    private String idempotencyKey;
    
    @Column(name = "status_code", nullable = false)
    private Integer statusCode;
    
    @Column(name = "response_body", columnDefinition = "TEXT", nullable = false)
    private String responseBody;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}


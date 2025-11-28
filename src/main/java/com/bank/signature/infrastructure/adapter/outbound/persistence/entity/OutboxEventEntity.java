package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for the outbox_event table.
 * 
 * <p><strong>Outbox Pattern Implementation:</strong></p>
 * <ul>
 *   <li>Events persisted in this table within application transaction</li>
 *   <li>Debezium CDC connector reads this table and publishes to Kafka</li>
 *   <li>published_at set by Debezium after successful Kafka publish</li>
 * </ul>
 * 
 * <p><strong>Table Structure:</strong></p>
 * <pre>
 * CREATE TABLE outbox_event (
 *     id UUID PRIMARY KEY,
 *     aggregate_id UUID NOT NULL,
 *     aggregate_type VARCHAR(100) NOT NULL,
 *     event_type VARCHAR(100) NOT NULL,
 *     payload JSONB NOT NULL,
 *     payload_hash VARCHAR(64),
 *     created_at TIMESTAMPTZ NOT NULL,
 *     published_at TIMESTAMPTZ
 * );
 * </pre>
 * 
 * @see com.bank.signature.infrastructure.adapter.outbound.event.OutboxEventPublisherAdapter
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@Entity
@Table(name = "outbox_event")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEventEntity {
    
    /**
     * Primary key (UUIDv7 for time-ordered sorting).
     */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;
    
    /**
     * ID of the aggregate that triggered this event.
     * Used as Kafka partition key for ordering guarantees.
     */
    @Column(name = "aggregate_id", nullable = false, columnDefinition = "uuid")
    private UUID aggregateId;
    
    /**
     * Type of aggregate (e.g., "SignatureRequest", "Provider").
     */
    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;
    
    /**
     * Event type (e.g., "SIGNATURE_REQUEST_CREATED").
     * Maps to Avro schema event type enum.
     */
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;
    
    /**
     * Event payload as JSON.
     * Stored as JSONB in PostgreSQL for efficient querying.
     * Contains serialized DomainEvent fields.
     */
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String payload;  // JSON string
    
    /**
     * SHA-256 hash of payload for integrity validation.
     * Used to detect tampering or corruption.
     */
    @Column(name = "payload_hash", length = 64)
    private String payloadHash;
    
    /**
     * Timestamp when event was created by application.
     * Indexed for efficient queries on pending events.
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    /**
     * Timestamp when Debezium published event to Kafka.
     * NULL until published.
     * Updated by Debezium connector after successful Kafka write.
     */
    @Column(name = "published_at")
    private Instant publishedAt;
}


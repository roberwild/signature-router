package com.singularbank.signature.routing.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Base interface for all domain events in the Signature Router system.
 * 
 * <p><strong>Purpose:</strong></p>
 * <ul>
 *   <li>Standardize event structure across all domain events</li>
 *   <li>Enable generic event publishing via Outbox pattern</li>
 *   <li>Facilitate correlation and distributed tracing</li>
 *   <li>Support event versioning and schema evolution</li>
 * </ul>
 * 
 * <p><strong>Implementation Guidelines:</strong></p>
 * <ul>
 *   <li>All domain events MUST implement this interface</li>
 *   <li>Events SHOULD be immutable (use records or @Value)</li>
 *   <li>eventId MUST be UUIDv7 for time-ordered sorting</li>
 *   <li>correlationId SHOULD be propagated from MDC or HTTP headers</li>
 * </ul>
 * 
 * <p><strong>Outbox Pattern:</strong></p>
 * Events implementing this interface are persisted to the outbox_event table
 * before being published to Kafka via Debezium CDC.
 * 
 * @see com.singularbank.signature.routing.application.port.output.EventPublisher
 * @since Story 5.1 - Outbox Pattern Implementation
 */
public interface DomainEvent {
    
    /**
     * Unique identifier for this specific event instance.
     * MUST be UUIDv7 for time-ordered generation.
     * 
     * @return Event ID (UUIDv7)
     */
    UUID getEventId();
    
    /**
     * ID of the aggregate that triggered this event.
     * Used as Kafka partition key for ordering guarantees.
     * 
     * @return Aggregate ID (typically SignatureRequest ID)
     */
    UUID getAggregateId();
    
    /**
     * Type of aggregate that triggered this event.
     * Used for event routing and filtering.
     * 
     * @return Aggregate type (e.g., "SignatureRequest", "RoutingRule")
     */
    String getAggregateType();
    
    /**
     * Type of this event.
     * MUST match Avro schema event type enum.
     * 
     * @return Event type (e.g., "SIGNATURE_REQUEST_CREATED")
     */
    String getEventType();
    
    /**
     * Timestamp when the event occurred.
     * Used for event ordering and analytics.
     * 
     * @return Event occurrence timestamp
     */
    Instant getOccurredAt();
    
    /**
     * Correlation ID for distributed tracing.
     * Propagated from HTTP headers (X-Correlation-ID) or MDC.
     * 
     * @return Correlation ID (UUID string)
     */
    String getCorrelationId();
    
    /**
     * Event schema version for evolution tracking.
     * Default implementation returns "1.0.0".
     * 
     * @return Schema version (SemVer format)
     */
    default String getVersion() {
        return "1.0.0";
    }
}


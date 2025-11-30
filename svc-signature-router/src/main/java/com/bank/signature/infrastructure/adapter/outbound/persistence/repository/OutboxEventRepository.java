package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.OutboxEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository for outbox_event table.
 * 
 * <p><strong>Query Patterns:</strong></p>
 * <ul>
 *   <li>Find pending events (published_at IS NULL) for monitoring</li>
 *   <li>Find events by aggregate ID for event sourcing/replay</li>
 *   <li>Count pending events for metrics</li>
 * </ul>
 * 
 * <p><strong>Performance Considerations:</strong></p>
 * <ul>
 *   <li>Index on created_at WHERE published_at IS NULL (pending events)</li>
 *   <li>Index on aggregate_id for event timeline queries</li>
 *   <li>Periodic purge of published events (retention policy)</li>
 * </ul>
 * 
 * @see OutboxEventEntity
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, UUID> {
    
    /**
     * Find all events for a specific aggregate, ordered by creation time.
     * Useful for event sourcing and debugging.
     * 
     * @param aggregateId The aggregate ID
     * @return List of events for this aggregate, oldest first
     */
    List<OutboxEventEntity> findByAggregateIdOrderByCreatedAtAsc(UUID aggregateId);
    
    /**
     * Find all events that haven't been published to Kafka yet.
     * Used for monitoring lag and troubleshooting Debezium issues.
     * 
     * @return List of pending events
     */
    List<OutboxEventEntity> findByPublishedAtIsNull();
    
    /**
     * Count pending events (not yet published).
     * Used for Prometheus metrics: outbox.events.pending gauge.
     * 
     * @return Number of events with published_at IS NULL
     */
    @Query("SELECT COUNT(o) FROM OutboxEventEntity o WHERE o.publishedAt IS NULL")
    long countPendingEvents();
    
    /**
     * Find pending events by event type for metrics breakdown.
     * 
     * @param eventType The event type to filter
     * @return List of pending events of this type
     */
    List<OutboxEventEntity> findByEventTypeAndPublishedAtIsNull(String eventType);
}


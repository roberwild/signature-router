package com.singularbank.signature.routing.domain.port.outbound;

import com.singularbank.signature.routing.domain.event.*;

import java.util.List;

/**
 * Outbound port for publishing domain events via Outbox pattern.
 * 
 * <p><strong>Evolution History:</strong></p>
 * <ul>
 *   <li>Story 2.11: Initial interface with SignatureCompleted event</li>
 *   <li>Story 2.12: Added SignatureAborted event</li>
 *   <li>Story 4.8: Added Circuit Breaker events</li>
 *   <li>Story 5.1: Refactored to generic DomainEvent interface + Outbox pattern</li>
 * </ul>
 * 
 * <p><strong>Outbox Pattern Implementation:</strong></p>
 * <ul>
 *   <li>Events are persisted to outbox_event table (NOT published directly to Kafka)</li>
 *   <li>Debezium CDC connector reads outbox table and publishes to Kafka</li>
 *   <li>Guarantees atomicity: state change + event in same transaction</li>
 *   <li>Zero data loss: events survive application crashes</li>
 * </ul>
 * 
 * @see com.singularbank.signature.routing.infrastructure.adapter.outbound.event.OutboxEventPublisherAdapter
 * @since Story 2.11
 */
public interface EventPublisher {
    
    /**
     * Publish a single domain event to the outbox table.
     * 
     * <p><strong>CRITICAL:</strong> MUST be called within an active transaction.</p>
     * <ul>
     *   <li>Propagation: MANDATORY (method will fail if no TX active)</li>
     *   <li>Event persisted to outbox_event table</li>
     *   <li>Debezium publishes to Kafka asynchronously</li>
     * </ul>
     * 
     * <p><strong>Usage Example:</strong></p>
     * <pre>{@code
     * @Transactional
     * public void completeSignature(UUID requestId, String code) {
     *     SignatureRequest request = repository.findById(requestId);
     *     request.complete(code);
     *     repository.save(request);  // State change
     *     
     *     DomainEvent event = SignatureCompletedEvent.from(request, correlationId);
     *     eventPublisher.publish(event);  // Event persisted (same TX)
     * }
     * }</pre>
     * 
     * @param event Domain event to publish
     * @throws IllegalStateException if no transaction active (Propagation.MANDATORY)
     * @since Story 5.1
     */
    void publish(DomainEvent event);
    
    /**
     * Publish multiple domain events in batch.
     * Useful when a single operation triggers multiple events.
     * 
     * <p><strong>CRITICAL:</strong> MUST be called within an active transaction.</p>
     * 
     * @param events List of domain events to publish
     * @throws IllegalStateException if no transaction active (Propagation.MANDATORY)
     * @since Story 5.1
     */
    void publishAll(List<DomainEvent> events);
    
    // ========================================================================
    // DEPRECATED METHODS - Kept for backward compatibility (Epic 2-4)
    // Will be removed in Story 5.2 when all use cases migrate to generic publish()
    // ========================================================================
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The event to publish
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishSignatureCompleted(SignatureCompletedEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The event to publish
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishSignatureAborted(SignatureAbortedEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The circuit breaker opened event
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishCircuitBreakerOpened(CircuitBreakerOpenedEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The circuit breaker half-open event
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishCircuitBreakerHalfOpen(CircuitBreakerHalfOpenEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The circuit breaker closed event
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishCircuitBreakerClosed(CircuitBreakerClosedEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The circuit breaker failed recovery event
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishCircuitBreakerFailedRecovery(CircuitBreakerFailedRecoveryEvent event) {
        publish(event);
    }
    
    /**
     * @deprecated Use {@link #publish(DomainEvent)} instead.
     * @param event The circuit breaker reset event
     */
    @Deprecated(since = "Story 5.1", forRemoval = true)
    default void publishCircuitBreakerReset(CircuitBreakerResetEvent event) {
        publish(event);
    }
}


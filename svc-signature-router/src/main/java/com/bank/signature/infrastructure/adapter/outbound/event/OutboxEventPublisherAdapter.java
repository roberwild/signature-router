package com.bank.signature.infrastructure.adapter.outbound.event;

import com.bank.signature.domain.event.DomainEvent;
import com.bank.signature.domain.port.outbound.EventPublisher;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.OutboxEventEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.uuid.UuidCreator;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

/**
 * Adapter implementation of EventPublisher port using Outbox pattern.
 * 
 * <p><strong>Outbox Pattern Flow:</strong></p>
 * <ol>
 *   <li>Application calls publish() within active transaction</li>
 *   <li>Event serialized to JSON and persisted to outbox_event table</li>
 *   <li>Transaction commits → event + state change guaranteed atomic</li>
 *   <li>Debezium CDC connector reads outbox table (PostgreSQL WAL)</li>
 *   <li>Debezium publishes event to Kafka topic signature.events</li>
 *   <li>Debezium updates published_at timestamp</li>
 * </ol>
 * 
 * <p><strong>Transaction Propagation:</strong></p>
 * MANDATORY - This method MUST be called within an existing transaction.
 * If no transaction active, throws IllegalTransactionStateException.
 * 
 * <p><strong>Performance:</strong></p>
 * <ul>
 *   <li>Serialization: ~2-5ms P99 (Jackson)</li>
 *   <li>SHA-256 hash: ~1ms P99</li>
 *   <li>JPA insert: ~10-20ms P99 (depends on DB load)</li>
 *   <li>Total: ~15-30ms P99</li>
 * </ul>
 * 
 * @see EventPublisher
 * @see OutboxEventEntity
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@Slf4j
@Component
@Primary
public class OutboxEventPublisherAdapter implements EventPublisher {
    
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final Counter eventsCreatedCounter;
    private final Timer publishDurationTimer;
    
    public OutboxEventPublisherAdapter(
        OutboxEventRepository outboxRepository,
        ObjectMapper objectMapper,
        MeterRegistry meterRegistry
    ) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        
        // Metrics
        this.eventsCreatedCounter = Counter.builder("outbox.events.created.total")
            .description("Total number of events created in outbox")
            .tag("component", "outbox")
            .register(meterRegistry);
            
        this.publishDurationTimer = Timer.builder("outbox.publish.duration.seconds")
            .description("Duration of event publishing to outbox")
            .tag("component", "outbox")
            .register(meterRegistry);
    }
    
    /**
     * Publish a single domain event to the outbox table.
     * 
     * <p><strong>CRITICAL:</strong> MUST be called within an active transaction.</p>
     * 
     * @param event Domain event to publish
     * @throws IllegalStateException if no transaction active (Propagation.MANDATORY)
     * @throws RuntimeException if serialization or persistence fails
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publish(DomainEvent event) {
        publishDurationTimer.record(() -> {
            try {
                // Serialize event to JSON
                String payload = objectMapper.writeValueAsString(event);
                String payloadHash = sha256(payload);
                
                // Create outbox entity
                OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
                    .id(UuidCreator.getTimeOrderedEpoch())
                    .aggregateId(event.getAggregateId())
                    .aggregateType(event.getAggregateType())
                    .eventType(event.getEventType())
                    .payload(payload)
                    .payloadHash(payloadHash)
                    .createdAt(Instant.now())
                    .publishedAt(null)  // Will be set by Debezium
                    .build();
                
                // Persist to outbox table (same TX as aggregate)
                outboxRepository.save(outboxEvent);
                
                // Update metrics
                eventsCreatedCounter.increment();
                
                log.debug("Event persisted to outbox: eventType={}, aggregateId={}, eventId={}", 
                    event.getEventType(), event.getAggregateId(), event.getEventId());
                    
            } catch (Exception e) {
                log.error("Failed to persist event to outbox: eventType={}, aggregateId={}, error={}", 
                    event.getEventType(), event.getAggregateId(), e.getMessage(), e);
                throw new RuntimeException("Failed to publish event to outbox", e);
            }
        });
    }
    
    /**
     * Publish multiple domain events in batch.
     * All events persisted in same transaction.
     * 
     * @param events List of domain events to publish
     * @throws IllegalStateException if no transaction active
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publishAll(List<DomainEvent> events) {
        events.forEach(this::publish);
        log.debug("Batch published {} events to outbox", events.size());
    }
    
    /**
     * Compute SHA-256 hash of input string.
     * Used for payload integrity validation.
     * 
     * @param input Input string to hash
     * @return Hex-encoded SHA-256 hash (64 characters)
     */
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute SHA-256 hash", e);
        }
    }
}


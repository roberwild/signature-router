package com.bank.signature.infrastructure.adapter.outbound.event;

import com.bank.signature.domain.event.SignatureCompletedEvent;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.port.outbound.EventPublisher;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.OutboxEventEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.OutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

/**
 * Integration tests for Outbox Pattern implementation.
 * 
 * Tests verify:
 * - Event persistence to outbox_event table
 * - Transaction atomicity (rollback scenario)
 * - Multiple events in same transaction
 * - published_at remains NULL (Debezium will update)
 * - PostgreSQL JSONB storage
 * 
 * Uses Testcontainers PostgreSQL 15 for realistic testing.
 * 
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class OutboxPatternIT {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("signature_test")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private EventPublisher eventPublisher;
    
    @Autowired
    private OutboxEventRepository outboxRepository;
    
    @Autowired
    private TransactionTemplate transactionTemplate;
    
    @Test
    void shouldPersistEventInOutboxWithinTransaction() {
        // Given
        UUID signatureRequestId = UUID.randomUUID();
        UUID challengeId = UUID.randomUUID();
        
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            signatureRequestId,
            challengeId,
            ChannelType.SMS,
            "test-correlation-123"
        );
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event);
            return null;
        });
        
        // Then
        List<OutboxEventEntity> events = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId);
        assertThat(events).hasSize(1);
        
        OutboxEventEntity saved = events.get(0);
        assertThat(saved.getEventType()).isEqualTo("SIGNATURE_COMPLETED");
        assertThat(saved.getAggregateType()).isEqualTo("SignatureRequest");
        assertThat(saved.getPublishedAt()).isNull();
        assertThat(saved.getPayloadHash()).isNotBlank();
        assertThat(saved.getPayload()).contains("\"channelType\":\"SMS\"");
    }
    
    @Test
    void shouldGuaranteeAtomicity_whenTransactionRollback() {
        // Given
        UUID signatureRequestId = UUID.randomUUID();
        UUID challengeId = UUID.randomUUID();
        
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            signatureRequestId,
            challengeId,
            ChannelType.SMS,
            "test-correlation-rollback"
        );
        
        // When - Simulate rollback
        assertThatThrownBy(() -> {
            transactionTemplate.execute(status -> {
                eventPublisher.publish(event);
                throw new RuntimeException("Simulated failure - rollback");
            });
        }).isInstanceOf(RuntimeException.class);
        
        // Then - NO event in outbox
        List<OutboxEventEntity> events = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId);
        assertThat(events).isEmpty();
    }
    
    @Test
    void shouldPersistMultipleEventsInSameTransaction() {
        // Given
        UUID signatureRequestId1 = UUID.randomUUID();
        UUID signatureRequestId2 = UUID.randomUUID();
        UUID signatureRequestId3 = UUID.randomUUID();
        
        SignatureCompletedEvent event1 = SignatureCompletedEvent.create(
            signatureRequestId1, UUID.randomUUID(), ChannelType.SMS, "corr-1"
        );
        SignatureCompletedEvent event2 = SignatureCompletedEvent.create(
            signatureRequestId2, UUID.randomUUID(), ChannelType.PUSH, "corr-2"
        );
        SignatureCompletedEvent event3 = SignatureCompletedEvent.create(
            signatureRequestId3, UUID.randomUUID(), ChannelType.VOICE, "corr-3"
        );
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event1);
            eventPublisher.publish(event2);
            eventPublisher.publish(event3);
            return null;
        });
        
        // Then
        long count = outboxRepository.count();
        assertThat(count).isGreaterThanOrEqualTo(3);
        
        List<OutboxEventEntity> events1 = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId1);
        List<OutboxEventEntity> events2 = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId2);
        List<OutboxEventEntity> events3 = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId3);
        
        assertThat(events1).hasSize(1);
        assertThat(events2).hasSize(1);
        assertThat(events3).hasSize(1);
    }
    
    @Test
    void shouldStorePendingEventsCorrectly() {
        // Given
        UUID signatureRequestId = UUID.randomUUID();
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            signatureRequestId,
            UUID.randomUUID(),
            ChannelType.SMS,
            "pending-test"
        );
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event);
            return null;
        });
        
        // Then - Verify pending events query
        List<OutboxEventEntity> pendingEvents = outboxRepository.findByPublishedAtIsNull();
        assertThat(pendingEvents).isNotEmpty();
        
        long pendingCount = outboxRepository.countPendingEvents();
        assertThat(pendingCount).isGreaterThan(0);
    }
    
    @Test
    void shouldStoreJsonbPayloadCorrectly() {
        // Given
        UUID signatureRequestId = UUID.randomUUID();
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            signatureRequestId,
            UUID.randomUUID(),
            ChannelType.SMS,
            "jsonb-test"
        );
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event);
            return null;
        });
        
        // Then - Verify JSONB content
        List<OutboxEventEntity> events = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId);
        assertThat(events).hasSize(1);
        
        String payload = events.get(0).getPayload();
        assertThat(payload).isNotBlank();
        assertThat(payload).contains("\"eventType\":\"SIGNATURE_COMPLETED\"");
        assertThat(payload).contains("\"aggregateType\":\"SignatureRequest\"");
        assertThat(payload).contains("\"channelType\":\"SMS\"");
        assertThat(payload).contains("\"correlationId\":\"jsonb-test\"");
    }
    
    @Test
    void shouldThrowExceptionWhenNoTransactionActive() {
        // Given
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            UUID.randomUUID(),
            UUID.randomUUID(),
            ChannelType.SMS,
            "no-tx-test"
        );
        
        // When/Then - Should fail with Propagation.MANDATORY
        assertThatThrownBy(() -> eventPublisher.publish(event))
            .isInstanceOf(org.springframework.transaction.IllegalTransactionStateException.class);
    }
    
    @Test
    void shouldGenerateUniqueEventIds() {
        // Given
        UUID signatureRequestId = UUID.randomUUID();
        SignatureCompletedEvent event1 = SignatureCompletedEvent.create(
            signatureRequestId, UUID.randomUUID(), ChannelType.SMS, "corr-1"
        );
        SignatureCompletedEvent event2 = SignatureCompletedEvent.create(
            signatureRequestId, UUID.randomUUID(), ChannelType.SMS, "corr-2"
        );
        
        // When
        transactionTemplate.execute(status -> {
            eventPublisher.publish(event1);
            eventPublisher.publish(event2);
            return null;
        });
        
        // Then
        List<OutboxEventEntity> events = outboxRepository.findByAggregateIdOrderByCreatedAtAsc(signatureRequestId);
        assertThat(events).hasSize(2);
        
        UUID id1 = events.get(0).getId();
        UUID id2 = events.get(1).getId();
        
        assertThat(id1).isNotEqualTo(id2);
        assertThat(id1.version()).isEqualTo(7); // UUIDv7
        assertThat(id2.version()).isEqualTo(7);
    }
}


package com.bank.signature.infrastructure.adapter.outbound.event;

import com.bank.signature.domain.event.*;
import com.bank.signature.events.avro.*;
import com.github.f4b6a3.uuid.UuidCreator;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for AvroEventMapper.
 * Story 5.5 - Event Serialization
 */
class AvroEventMapperTest {

    private final AvroEventMapper mapper = new AvroEventMapper();

    @Test
    void shouldMapSignatureCompletedEventToAvro() {
        // Given: Domain event
        UUID requestId = UuidCreator.getTimeOrderedEpoch();
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();

        SignatureCompletedEvent domainEvent = SignatureCompletedEvent.builder()
            .eventId(eventId)
            .occurredAt(now)
            .aggregateId(requestId)
            .aggregateType("SignatureRequest")
            .eventType("SIGNATURE_COMPLETED")
            .correlationId("corr-123")
            .requestId(requestId)
            .userId("user-hash-123")
            .transactionType("TRANSFER")
            .transactionAmount(1500.00)
            .provider("SMS_TWILIO")
            .channel("SMS")
            .verifiedCodeHash("sha256-hash")
            .completedAt(now)
            .timeTakenMs(5000L)
            .build();

        // When: Map to Avro
        com.bank.signature.events.avro.SignatureCompletedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("SIGNATURE_COMPLETED");
        assertThat(avroEvent.getOccurredAt()).isEqualTo(now.toEpochMilli());
        assertThat(avroEvent.getAggregateId()).isEqualTo(requestId.toString());
        assertThat(avroEvent.getAggregateType()).isEqualTo("SignatureRequest");
        assertThat(avroEvent.getCorrelationId()).isEqualTo("corr-123");
        assertThat(avroEvent.getVersion()).isEqualTo(1);

        // And: Payload mapped correctly
        SignatureCompletedPayload payload = avroEvent.getPayload();
        assertThat(payload.getRequestId()).isEqualTo(requestId.toString());
        assertThat(payload.getUserId()).isEqualTo("user-hash-123");
        assertThat(payload.getTransactionType()).isEqualTo("TRANSFER");
        assertThat(payload.getTransactionAmount()).isEqualTo(1500.00);
        assertThat(payload.getProvider()).isEqualTo("SMS_TWILIO");
        assertThat(payload.getChannel()).isEqualTo("SMS");
        assertThat(payload.getVerifiedCode()).isEqualTo("sha256-hash");
        assertThat(payload.getStatus()).isEqualTo("COMPLETED");
        assertThat(payload.getCompletedAt()).isEqualTo(now.toEpochMilli());
        assertThat(payload.getTimeTakenMs()).isEqualTo(5000L);
    }

    @Test
    void shouldMapSignatureAbortedEventToAvro() {
        // Given: Domain event
        UUID requestId = UuidCreator.getTimeOrderedEpoch();
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();

        SignatureAbortedEvent domainEvent = SignatureAbortedEvent.builder()
            .eventId(eventId)
            .occurredAt(now)
            .aggregateId(requestId)
            .aggregateType("SignatureRequest")
            .eventType("SIGNATURE_ABORTED")
            .correlationId("corr-456")
            .requestId(requestId)
            .userId("user-hash-456")
            .transactionType("PAYMENT")
            .abortReason("FRAUD_SUSPECTED")
            .abortedBy("admin-001")
            .abortedAt(now)
            .build();

        // When: Map to Avro
        com.bank.signature.events.avro.SignatureAbortedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("SIGNATURE_ABORTED");
        assertThat(avroEvent.getOccurredAt()).isEqualTo(now.toEpochMilli());
        assertThat(avroEvent.getAggregateId()).isEqualTo(requestId.toString());
        assertThat(avroEvent.getCorrelationId()).isEqualTo("corr-456");

        // And: Payload mapped correctly
        SignatureAbortedPayload payload = avroEvent.getPayload();
        assertThat(payload.getRequestId()).isEqualTo(requestId.toString());
        assertThat(payload.getUserId()).isEqualTo("user-hash-456");
        assertThat(payload.getTransactionType()).isEqualTo("PAYMENT");
        assertThat(payload.getAbortReason()).isEqualTo("FRAUD_SUSPECTED");
        assertThat(payload.getAbortedBy()).isEqualTo("admin-001");
        assertThat(payload.getStatus()).isEqualTo("ABORTED");
        assertThat(payload.getAbortedAt()).isEqualTo(now.toEpochMilli());
    }

    @Test
    void shouldMapCircuitBreakerOpenedEventToAvro() {
        // Given: Domain event
        UUID cbId = UuidCreator.getTimeOrderedEpoch();
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();

        CircuitBreakerOpenedEvent domainEvent = CircuitBreakerOpenedEvent.builder()
            .eventId(eventId)
            .occurredAt(now)
            .aggregateId(cbId)
            .aggregateType("CircuitBreaker")
            .eventType("CIRCUIT_BREAKER_OPENED")
            .correlationId("corr-cb-123")
            .providerName("SMS_TWILIO")
            .failureRate(0.75f)
            .failureThreshold(0.5f)
            .totalCalls(100)
            .failedCalls(75)
            .build();

        // When: Map to Avro
        com.bank.signature.events.avro.CircuitBreakerOpenedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("CIRCUIT_BREAKER_OPENED");
        assertThat(avroEvent.getAggregateId()).isEqualTo(cbId.toString());
        assertThat(avroEvent.getAggregateType()).isEqualTo("CircuitBreaker");

        // And: Payload mapped correctly
        CircuitBreakerOpenedPayload payload = avroEvent.getPayload();
        assertThat(payload.getProviderName()).isEqualTo("SMS_TWILIO");
        assertThat(payload.getFailureRate()).isEqualTo(0.75f);
        assertThat(payload.getFailureThreshold()).isEqualTo(0.5f);
        assertThat(payload.getTotalCalls()).isEqualTo(100);
        assertThat(payload.getFailedCalls()).isEqualTo(75);
        assertThat(payload.getState()).isEqualTo("OPEN");
        assertThat(payload.getOpenedAt()).isEqualTo(now.toEpochMilli());
    }

    @Test
    void shouldMapCircuitBreakerClosedEventToAvro() {
        // Given: Domain event
        UUID cbId = UuidCreator.getTimeOrderedEpoch();
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();

        CircuitBreakerClosedEvent domainEvent = CircuitBreakerClosedEvent.builder()
            .eventId(eventId)
            .occurredAt(now)
            .aggregateId(cbId)
            .aggregateType("CircuitBreaker")
            .eventType("CIRCUIT_BREAKER_CLOSED")
            .correlationId("corr-cb-456")
            .providerName("SMS_TWILIO")
            .downtimeDurationMs(300000L)  // 5 minutes
            .build();

        // When: Map to Avro
        com.bank.signature.events.avro.CircuitBreakerClosedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("CIRCUIT_BREAKER_CLOSED");
        assertThat(avroEvent.getAggregateId()).isEqualTo(cbId.toString());

        // And: Payload mapped correctly
        CircuitBreakerClosedPayload payload = avroEvent.getPayload();
        assertThat(payload.getProviderName()).isEqualTo("SMS_TWILIO");
        assertThat(payload.getState()).isEqualTo("CLOSED");
        assertThat(payload.getClosedAt()).isEqualTo(now.toEpochMilli());
        assertThat(payload.getDowntimeDurationMs()).isEqualTo(300000L);
    }

    @Test
    void shouldHandleNullCorrelationId() {
        // Given: Event without correlation ID
        SignatureCompletedEvent domainEvent = SignatureCompletedEvent.builder()
            .eventId(UuidCreator.getTimeOrderedEpoch())
            .occurredAt(Instant.now())
            .aggregateId(UuidCreator.getTimeOrderedEpoch())
            .aggregateType("SignatureRequest")
            .eventType("SIGNATURE_COMPLETED")
            .correlationId(null)  // No correlation ID
            .requestId(UuidCreator.getTimeOrderedEpoch())
            .userId("user-123")
            .transactionType("TRANSFER")
            .transactionAmount(100.0)
            .provider("SMS_TWILIO")
            .channel("SMS")
            .verifiedCodeHash("hash")
            .completedAt(Instant.now())
            .timeTakenMs(1000L)
            .build();

        // When: Map to Avro
        com.bank.signature.events.avro.SignatureCompletedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: Correlation ID is null (allowed by schema)
        assertThat(avroEvent.getCorrelationId()).isNull();
    }

    @Test
    void shouldThrowExceptionForUnknownEventType() {
        // Given: Unknown domain event
        DomainEvent unknownEvent = new DomainEvent() {
            @Override
            public UUID getEventId() { return UUID.randomUUID(); }
            @Override
            public UUID getAggregateId() { return UUID.randomUUID(); }
            @Override
            public String getAggregateType() { return "Unknown"; }
            @Override
            public String getEventType() { return "UNKNOWN_EVENT"; }
            @Override
            public Instant getOccurredAt() { return Instant.now(); }
            @Override
            public String getCorrelationId() { return null; }
        };

        // When/Then: Throws exception
        assertThatThrownBy(() -> mapper.toAvro(unknownEvent))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Unknown domain event type");
    }
}


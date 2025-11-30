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

        com.bank.signature.domain.event.SignatureCompletedEvent domainEvent = 
            new com.bank.signature.domain.event.SignatureCompletedEvent(
                eventId,
                requestId,
                UUID.randomUUID(),
                com.bank.signature.domain.model.valueobject.ChannelType.SMS,
                now,
                "corr-123"
            );

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
        assertThat(payload.getUserId()).isEqualTo("pseudonymized-user");
        assertThat(payload.getTransactionType()).isEqualTo("SIGNATURE_VERIFICATION");
        assertThat(payload.getTransactionAmount()).isNull();
        assertThat(payload.getProvider()).isEqualTo("UNKNOWN");
        assertThat(payload.getChannel()).isEqualTo("SMS");
        assertThat(payload.getVerifiedCode()).isEqualTo("hashed");
        assertThat(payload.getStatus()).isEqualTo("COMPLETED");
        assertThat(payload.getCompletedAt()).isEqualTo(now.toEpochMilli());
        assertThat(payload.getTimeTakenMs()).isEqualTo(0L);
    }

    @Test
    void shouldMapSignatureAbortedEventToAvro() {
        // Given: Domain event
        UUID requestId = UuidCreator.getTimeOrderedEpoch();
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();

        com.bank.signature.domain.event.SignatureAbortedEvent domainEvent =
            new com.bank.signature.domain.event.SignatureAbortedEvent(
                eventId,
                requestId,
                com.bank.signature.domain.model.valueobject.AbortReason.FRAUD_DETECTED,
                "Suspicious activity detected",
                now,
                "corr-456"
            );

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
        assertThat(payload.getUserId()).isEqualTo("pseudonymized-user");
        assertThat(payload.getTransactionType()).isEqualTo("SIGNATURE_VERIFICATION");
        assertThat(payload.getAbortReason()).isEqualTo("FRAUD_DETECTED");
        assertThat(payload.getAbortedBy()).isEqualTo("system");
        assertThat(payload.getStatus()).isEqualTo("ABORTED");
        assertThat(payload.getAbortedAt()).isEqualTo(now.toEpochMilli());
    }

    @Test
    void shouldMapCircuitBreakerOpenedEventToAvro() {
        // Given: Domain event
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();
        com.bank.signature.domain.model.valueobject.ProviderType providerType = 
            com.bank.signature.domain.model.valueobject.ProviderType.SMS;
        UUID expectedAggregateId = UUID.nameUUIDFromBytes(providerType.name().getBytes());

        com.bank.signature.domain.event.CircuitBreakerOpenedEvent domainEvent =
            new com.bank.signature.domain.event.CircuitBreakerOpenedEvent(
                eventId,
                providerType,
                io.github.resilience4j.circuitbreaker.CircuitBreaker.State.CLOSED,
                io.github.resilience4j.circuitbreaker.CircuitBreaker.State.OPEN,
                now,
                0.75f,  // failureRate
                0.1f,   // slowCallRate
                100,    // bufferedCalls
                75,     // failedCalls
                25,     // successfulCalls
                5,      // slowCalls
                0.5f,   // threshold
                "PT5M", // degradedModeDuration
                "corr-cb-123"
            );

        // When: Map to Avro
        com.bank.signature.events.avro.CircuitBreakerOpenedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("CIRCUIT_BREAKER_OPENED");
        assertThat(avroEvent.getAggregateId()).isEqualTo(expectedAggregateId.toString());
        assertThat(avroEvent.getAggregateType()).isEqualTo("Provider");

        // And: Payload mapped correctly
        CircuitBreakerOpenedPayload payload = avroEvent.getPayload();
        assertThat(payload.getProviderName()).isEqualTo("SMS");
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
        UUID eventId = UuidCreator.getTimeOrderedEpoch();
        Instant now = Instant.now();
        com.bank.signature.domain.model.valueobject.ProviderType providerType = 
            com.bank.signature.domain.model.valueobject.ProviderType.SMS;
        UUID expectedAggregateId = UUID.nameUUIDFromBytes(providerType.name().getBytes());

        com.bank.signature.domain.event.CircuitBreakerClosedEvent domainEvent =
            new com.bank.signature.domain.event.CircuitBreakerClosedEvent(
                eventId,
                providerType,
                io.github.resilience4j.circuitbreaker.CircuitBreaker.State.HALF_OPEN,
                io.github.resilience4j.circuitbreaker.CircuitBreaker.State.CLOSED,
                now,
                100,    // bufferedCalls
                5,      // failedCalls
                95,     // successfulCalls
                0.05f,  // failureRate
                "PT5M", // recoveryDuration
                "corr-cb-456"
            );

        // When: Map to Avro
        com.bank.signature.events.avro.CircuitBreakerClosedEvent avroEvent = mapper.toAvro(domainEvent);

        // Then: All fields mapped correctly
        assertThat(avroEvent.getEventId()).isEqualTo(eventId.toString());
        assertThat(avroEvent.getEventType()).isEqualTo("CIRCUIT_BREAKER_CLOSED");
        assertThat(avroEvent.getAggregateId()).isEqualTo(expectedAggregateId.toString());

        // And: Payload mapped correctly
        CircuitBreakerClosedPayload payload = avroEvent.getPayload();
        assertThat(payload.getProviderName()).isEqualTo("SMS");
        assertThat(payload.getState()).isEqualTo("CLOSED");
        assertThat(payload.getClosedAt()).isEqualTo(now.toEpochMilli());
        assertThat(payload.getDowntimeDurationMs()).isEqualTo(300000L);
    }

    @Test
    void shouldHandleNullCorrelationId() {
        // Given: Event without correlation ID
        com.bank.signature.domain.event.SignatureCompletedEvent domainEvent =
            new com.bank.signature.domain.event.SignatureCompletedEvent(
                UuidCreator.getTimeOrderedEpoch(),
                UuidCreator.getTimeOrderedEpoch(),
                UUID.randomUUID(),
                com.bank.signature.domain.model.valueobject.ChannelType.SMS,
                Instant.now(),
                null  // No correlation ID
            );

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


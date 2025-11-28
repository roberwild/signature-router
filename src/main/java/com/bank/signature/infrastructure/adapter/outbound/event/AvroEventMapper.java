package com.bank.signature.infrastructure.adapter.outbound.event;

import com.bank.signature.domain.event.*;
import com.bank.signature.events.avro.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Mapper component to convert domain events to Avro-generated DTOs.
 * This adapter translates between the domain layer (DomainEvent) and
 * the infrastructure layer (Avro-generated classes) for Kafka serialization.
 *
 * <p><b>Story 5.5 - Event Serialization:</b> This mapper ensures that domain events
 * are properly serialized to Avro format before being published to Kafka via Debezium.</p>
 *
 * @since Story 5.5
 */
@Component
public class AvroEventMapper {

    /**
     * Maps a generic DomainEvent to its corresponding Avro-generated DTO.
     *
     * @param domainEvent The domain event to map
     * @return The Avro-generated event DTO
     * @throws IllegalArgumentException if event type is not recognized
     */
    public Object toAvro(DomainEvent domainEvent) {
        return switch (domainEvent) {
            case com.bank.signature.domain.event.SignatureCompletedEvent event -> toAvro(event);
            case com.bank.signature.domain.event.SignatureAbortedEvent event -> toAvro(event);
            case com.bank.signature.domain.event.CircuitBreakerOpenedEvent event -> toAvro(event);
            case com.bank.signature.domain.event.CircuitBreakerClosedEvent event -> toAvro(event);
            case com.bank.signature.domain.event.CircuitBreakerHalfOpenEvent event -> toAvro(event);
            case com.bank.signature.domain.event.CircuitBreakerFailedRecoveryEvent event -> toAvro(event);
            case com.bank.signature.domain.event.CircuitBreakerResetEvent event -> toAvro(event);
            default -> throw new IllegalArgumentException(
                "Unknown domain event type: " + domainEvent.getClass().getName());
        };
    }

    /**
     * Maps SignatureCompletedEvent (domain) → SignatureCompletedEvent (Avro).
     */
    public com.bank.signature.events.avro.SignatureCompletedEvent toAvro(
        com.bank.signature.domain.event.SignatureCompletedEvent domain) {

        return com.bank.signature.events.avro.SignatureCompletedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("SIGNATURE_COMPLETED")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType("SignatureRequest")
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(SignatureCompletedPayload.newBuilder()
                .setRequestId(domain.signatureRequestId().toString())
                .setUserId("pseudonymized-user") // TODO: Get from aggregate
                .setTransactionType("SIGNATURE_VERIFICATION")
                .setTransactionAmount(null)
                .setProvider("UNKNOWN") // TODO: Get from aggregate
                .setChannel(domain.channelType().toString())
                .setVerifiedCode("hashed") // TODO: Get from aggregate
                .setStatus("COMPLETED")
                .setCompletedAt(domain.completedAt().toEpochMilli())
                .setTimeTakenMs(0L) // TODO: Calculate from aggregate
                .build())
            .build();
    }

    /**
     * Maps SignatureAbortedEvent (domain) → SignatureAbortedEvent (Avro).
     */
    public com.bank.signature.events.avro.SignatureAbortedEvent toAvro(
        com.bank.signature.domain.event.SignatureAbortedEvent domain) {

        return com.bank.signature.events.avro.SignatureAbortedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("SIGNATURE_ABORTED")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType("SignatureRequest")
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(SignatureAbortedPayload.newBuilder()
                .setRequestId(domain.signatureRequestId().toString())
                .setUserId("pseudonymized-user") // TODO: Get from aggregate
                .setTransactionType("SIGNATURE_VERIFICATION")
                .setAbortReason(domain.reason().toString())
                .setAbortedBy("system") // TODO: Get from domain event
                .setStatus("ABORTED")
                .setAbortedAt(domain.abortedAt().toEpochMilli())
                .build())
            .build();
    }

    /**
     * Maps CircuitBreakerOpenedEvent (domain) → CircuitBreakerOpenedEvent (Avro).
     */
    public com.bank.signature.events.avro.CircuitBreakerOpenedEvent toAvro(
        com.bank.signature.domain.event.CircuitBreakerOpenedEvent domain) {

        return com.bank.signature.events.avro.CircuitBreakerOpenedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("CIRCUIT_BREAKER_OPENED")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType(domain.getAggregateType())
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(CircuitBreakerOpenedPayload.newBuilder()
                .setProviderName(domain.providerType().toString())
                .setFailureRate(domain.failureRate())
                .setFailureThreshold(domain.threshold())
                .setTotalCalls(domain.bufferedCalls())
                .setFailedCalls(domain.failedCalls())
                .setState("OPEN")
                .setOpenedAt(domain.occurredAt().toEpochMilli())
                .build())
            .build();
    }

    /**
     * Maps CircuitBreakerClosedEvent (domain) → CircuitBreakerClosedEvent (Avro).
     */
    public com.bank.signature.events.avro.CircuitBreakerClosedEvent toAvro(
        com.bank.signature.domain.event.CircuitBreakerClosedEvent domain) {

        return com.bank.signature.events.avro.CircuitBreakerClosedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("CIRCUIT_BREAKER_CLOSED")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType(domain.getAggregateType())
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(CircuitBreakerClosedPayload.newBuilder()
                .setProviderName(domain.providerType().toString())
                .setState("CLOSED")
                .setClosedAt(domain.occurredAt().toEpochMilli())
                .setDowntimeDurationMs(parseDurationToMillis(domain.recoveryDuration()))
                .build())
            .build();
    }

    /**
     * Maps CircuitBreakerHalfOpenEvent (domain) → CircuitBreakerOpenedEvent (Avro with state HALF_OPEN).
     * Note: We reuse CircuitBreakerOpenedEvent schema for HALF_OPEN state.
     */
    public com.bank.signature.events.avro.CircuitBreakerOpenedEvent toAvro(
        com.bank.signature.domain.event.CircuitBreakerHalfOpenEvent domain) {

        return com.bank.signature.events.avro.CircuitBreakerOpenedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("CIRCUIT_BREAKER_HALF_OPEN")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType("CircuitBreaker")
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(CircuitBreakerOpenedPayload.newBuilder()
                .setProviderName(domain.providerType().toString())
                .setFailureRate(0.0f)  // Not applicable for HALF_OPEN
                .setFailureThreshold(0.0f)
                .setTotalCalls(domain.bufferedCalls())
                .setFailedCalls(domain.failedCalls())
                .setState("HALF_OPEN")
                .setOpenedAt(domain.occurredAt().toEpochMilli())
                .build())
            .build();
    }

    /**
     * Maps CircuitBreakerFailedRecoveryEvent (domain) → CircuitBreakerOpenedEvent (Avro with state OPEN).
     */
    public com.bank.signature.events.avro.CircuitBreakerOpenedEvent toAvro(
        com.bank.signature.domain.event.CircuitBreakerFailedRecoveryEvent domain) {

        return com.bank.signature.events.avro.CircuitBreakerOpenedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("CIRCUIT_BREAKER_FAILED_RECOVERY")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType("CircuitBreaker")
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(CircuitBreakerOpenedPayload.newBuilder()
                .setProviderName(domain.providerType().toString())
                .setFailureRate(domain.failureRate())
                .setFailureThreshold(0.5f)  // Default threshold
                .setTotalCalls(domain.bufferedCalls())
                .setFailedCalls(domain.failedCalls())
                .setState("OPEN")
                .setOpenedAt(domain.occurredAt().toEpochMilli())
                .build())
            .build();
    }

    /**
     * Maps CircuitBreakerResetEvent (domain) → CircuitBreakerClosedEvent (Avro).
     */
    public com.bank.signature.events.avro.CircuitBreakerClosedEvent toAvro(
        com.bank.signature.domain.event.CircuitBreakerResetEvent domain) {

        return com.bank.signature.events.avro.CircuitBreakerClosedEvent.newBuilder()
            .setEventId(domain.getEventId().toString())
            .setEventType("CIRCUIT_BREAKER_RESET")
            .setOccurredAt(domain.getOccurredAt().toEpochMilli())
            .setAggregateId(domain.getAggregateId().toString())
            .setAggregateType("CircuitBreaker")
            .setCorrelationId(domain.getCorrelationId())
            .setVersion(1)
            .setPayload(CircuitBreakerClosedPayload.newBuilder()
                .setProviderName(domain.providerType().toString())
                .setState("CLOSED")
                .setClosedAt(domain.occurredAt().toEpochMilli())
                .setDowntimeDurationMs(0L)  // Reset = no downtime
                .build())
            .build();
    }
    
    /**
     * Helper method to parse ISO-8601 duration string to milliseconds.
     * @param duration ISO-8601 duration (e.g., "PT2M30S" = 2 minutes 30 seconds)
     * @return Duration in milliseconds
     */
    private long parseDurationToMillis(String duration) {
        try {
            return java.time.Duration.parse(duration).toMillis();
        } catch (Exception e) {
            return 0L;
        }
    }
}


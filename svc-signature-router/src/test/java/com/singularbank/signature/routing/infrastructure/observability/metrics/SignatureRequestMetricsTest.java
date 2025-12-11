package com.singularbank.signature.routing.infrastructure.observability.metrics;

import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import com.singularbank.signature.routing.domain.model.valueobject.Money;
import com.singularbank.signature.routing.domain.model.valueobject.RoutingEvent;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import com.singularbank.signature.routing.domain.model.valueobject.TransactionContext;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for SignatureRequestMetrics.
 * 
 * <p>Uses SimpleMeterRegistry (NOT mock) for realistic metric validation.
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC14)
 */
class SignatureRequestMetricsTest {

    private MeterRegistry meterRegistry;
    private SignatureRequestMetrics signatureRequestMetrics;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        signatureRequestMetrics = new SignatureRequestMetrics(meterRegistry);
    }

    @Test
    void shouldIncrementCreatedCounterWhenRecordCreated() {
        // Given
        SignatureRequest request = createSignatureRequest("CUST123", ChannelType.SMS);

        // When
        signatureRequestMetrics.recordCreated(request);

        // Then
        Counter counter = meterRegistry.find("signature.requests.created.total")
            .tag("channel", "SMS")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldIncrementCreatedCounterMultipleTimes() {
        // Given
        SignatureRequest request1 = createSignatureRequest("CUST123", ChannelType.SMS);
        SignatureRequest request2 = createSignatureRequest("CUST123", ChannelType.SMS);

        // When
        signatureRequestMetrics.recordCreated(request1);
        signatureRequestMetrics.recordCreated(request2);

        // Then
        Counter counter = meterRegistry.find("signature.requests.created.total")
            .tag("channel", "SMS")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(2.0);
    }

    @Test
    void shouldApplyChannelTagCorrectly() {
        // Given
        SignatureRequest smsRequest = createSignatureRequest("CUST123", ChannelType.SMS);
        SignatureRequest pushRequest = createSignatureRequest("CUST456", ChannelType.PUSH);

        // When
        signatureRequestMetrics.recordCreated(smsRequest);
        signatureRequestMetrics.recordCreated(pushRequest);

        // Then
        Counter smsCounter = meterRegistry.find("signature.requests.created.total")
            .tag("channel", "SMS")
            .counter();
        
        Counter pushCounter = meterRegistry.find("signature.requests.created.total")
            .tag("channel", "PUSH")
            .counter();
        
        assertThat(smsCounter).isNotNull();
        assertThat(smsCounter.count()).isEqualTo(1.0);
        
        assertThat(pushCounter).isNotNull();
        assertThat(pushCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldNotExposeCustomerIdInMetricTag_GdprCompliance() {
        // Given
        SignatureRequest request = createSignatureRequest("CUST123", ChannelType.SMS);

        // When
        signatureRequestMetrics.recordCreated(request);

        // Then
        // Verify customer ID is NOT exposed in tags (GDPR compliance)
        Counter counter = meterRegistry.find("signature.requests.created.total")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.getId().getTags()).noneMatch(tag -> tag.getKey().equals("customer_id"));
    }

    @Test
    void shouldIncrementCompletedCounterWhenRecordCompleted() {
        // Given
        SignatureRequest request = createCompletedSignatureRequest(SignatureStatus.SIGNED);

        // When
        signatureRequestMetrics.recordCompleted(request);

        // Then
        Counter counter = meterRegistry.find("signature.requests.completed.total")
            .tag("status", "SIGNED")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldRecordDurationHistogramWhenRecordCompleted() {
        // Given
        Instant createdAt = Instant.now().minus(Duration.ofMinutes(2));
        Instant signedAt = Instant.now();
        SignatureRequest request = createSignatureRequestWithTimestamps(createdAt, signedAt, SignatureStatus.SIGNED);

        // When
        signatureRequestMetrics.recordCompleted(request);

        // Then
        Timer timer = meterRegistry.find("signature.requests.duration.seconds")
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
        assertThat(timer.totalTime(TimeUnit.SECONDS)).isGreaterThanOrEqualTo(120); // 2 minutos
    }

    @Test
    void shouldApplyStatusTagCorrectlyInCompletedMetric() {
        // Given
        SignatureRequest signedRequest = createCompletedSignatureRequest(SignatureStatus.SIGNED);
        SignatureRequest abortedRequest = createCompletedSignatureRequest(SignatureStatus.ABORTED);
        SignatureRequest expiredRequest = createCompletedSignatureRequest(SignatureStatus.EXPIRED);

        // When
        signatureRequestMetrics.recordCompleted(signedRequest);
        signatureRequestMetrics.recordCompleted(abortedRequest);
        signatureRequestMetrics.recordCompleted(expiredRequest);

        // Then
        Counter signedCounter = meterRegistry.find("signature.requests.completed.total")
            .tag("status", "SIGNED")
            .counter();
        
        Counter abortedCounter = meterRegistry.find("signature.requests.completed.total")
            .tag("status", "ABORTED")
            .counter();
        
        Counter expiredCounter = meterRegistry.find("signature.requests.completed.total")
            .tag("status", "EXPIRED")
            .counter();
        
        assertThat(signedCounter.count()).isEqualTo(1.0);
        assertThat(abortedCounter.count()).isEqualTo(1.0);
        assertThat(expiredCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldUseCurrentTimeIfSignedAtIsNull() {
        // Given
        Instant createdAt = Instant.now().minus(Duration.ofMinutes(2));
        List<RoutingEvent> routingTimeline = new ArrayList<>();
        routingTimeline.add(new RoutingEvent(
            createdAt,
            "ROUTING_DECISION",
            null,
            ChannelType.SMS,
            "Initial routing decision"
        ));
        
        SignatureRequest request = SignatureRequest.builder()
            .id(UUID.randomUUID())
            .customerId("CUST123")
            .transactionContext(createTransactionContext())
            .status(SignatureStatus.SIGNED)
            .challenges(new ArrayList<>())
            .routingTimeline(routingTimeline)
            .createdAt(createdAt)
            .signedAt(null) // NULL - should use Instant.now()
            .expiresAt(Instant.now().plus(Duration.ofMinutes(3)))
            .build();

        // When
        signatureRequestMetrics.recordCompleted(request);

        // Then
        Timer timer = meterRegistry.find("signature.requests.duration.seconds")
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
        assertThat(timer.totalTime(TimeUnit.SECONDS)).isGreaterThanOrEqualTo(120);
    }

    // Helper methods

    private SignatureRequest createSignatureRequest(String customerId, ChannelType channelType) {
        List<RoutingEvent> routingTimeline = new ArrayList<>();
        routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "ROUTING_DECISION",
            null,
            channelType,
            "Initial routing decision"
        ));
        
        return SignatureRequest.builder()
            .id(UUID.randomUUID())
            .customerId(customerId)
            .transactionContext(createTransactionContext())
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(routingTimeline)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(Duration.ofMinutes(3)))
            .build();
    }

    private SignatureRequest createCompletedSignatureRequest(SignatureStatus status) {
        Instant createdAt = Instant.now().minus(Duration.ofMinutes(2));
        Instant signedAt = Instant.now();
        return createSignatureRequestWithTimestamps(createdAt, signedAt, status);
    }

    private SignatureRequest createSignatureRequestWithTimestamps(Instant createdAt, Instant signedAt, SignatureStatus status) {
        List<RoutingEvent> routingTimeline = new ArrayList<>();
        routingTimeline.add(new RoutingEvent(
            createdAt,
            "ROUTING_DECISION",
            null,
            ChannelType.SMS,
            "Initial routing decision"
        ));
        
        return SignatureRequest.builder()
            .id(UUID.randomUUID())
            .customerId("CUST123")
            .transactionContext(createTransactionContext())
            .status(status)
            .challenges(new ArrayList<>())
            .routingTimeline(routingTimeline)
            .createdAt(createdAt)
            .signedAt(signedAt)
            .expiresAt(createdAt.plus(Duration.ofMinutes(3)))
            .build();
    }

    private TransactionContext createTransactionContext() {
        return new TransactionContext(
            new Money(BigDecimal.valueOf(100.00), "USD"),
            "MERCHANT123",
            "ORDER456",
            "Test transaction",
            "a".repeat(64) // Valid SHA256 hash (64 hex chars)
        );
    }
}


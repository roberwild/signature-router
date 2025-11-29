package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.model.valueobject.ChannelType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for RoutingMetrics.
 * 
 * <p>Uses SimpleMeterRegistry (NOT mock) for realistic metric validation.
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC14)
 */
class RoutingMetricsTest {

    private MeterRegistry meterRegistry;
    private RoutingMetrics routingMetrics;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        routingMetrics = new RoutingMetrics(meterRegistry);
    }

    @Test
    void shouldIncrementDecisionCounterWhenRecordDecision() {
        // Given
        RoutingRule rule = createRoutingRule();

        // When
        routingMetrics.recordDecision(rule, ChannelType.SMS);

        // Then
        Counter counter = meterRegistry.find("routing.decisions.total")
            .tag("rule_id", rule.getId().toString())
            .tag("channel", "SMS")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldApplyRuleIdAndChannelTagsCorrectly() {
        // Given
        RoutingRule rule1 = createRoutingRule();
        RoutingRule rule2 = createRoutingRule();

        // When
        routingMetrics.recordDecision(rule1, ChannelType.SMS);
        routingMetrics.recordDecision(rule2, ChannelType.PUSH);

        // Then
        Counter smsCounter = meterRegistry.find("routing.decisions.total")
            .tag("rule_id", rule1.getId().toString())
            .tag("channel", "SMS")
            .counter();
        
        Counter pushCounter = meterRegistry.find("routing.decisions.total")
            .tag("rule_id", rule2.getId().toString())
            .tag("channel", "PUSH")
            .counter();
        
        assertThat(smsCounter).isNotNull();
        assertThat(smsCounter.count()).isEqualTo(1.0);
        
        assertThat(pushCounter).isNotNull();
        assertThat(pushCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldIncrementDecisionCounterMultipleTimes() {
        // Given
        RoutingRule rule = createRoutingRule();

        // When
        routingMetrics.recordDecision(rule, ChannelType.SMS);
        routingMetrics.recordDecision(rule, ChannelType.SMS);
        routingMetrics.recordDecision(rule, ChannelType.SMS);

        // Then
        Counter counter = meterRegistry.find("routing.decisions.total")
            .tag("rule_id", rule.getId().toString())
            .tag("channel", "SMS")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(3.0);
    }

    @Test
    void shouldIncrementFallbackCounterWhenRecordFallback() {
        // When
        routingMetrics.recordFallback(ChannelType.SMS, ChannelType.PUSH, "provider_unavailable");

        // Then
        Counter counter = meterRegistry.find("routing.fallback.triggered.total")
            .tag("from_channel", "SMS")
            .tag("to_channel", "PUSH")
            .tag("reason", "provider_unavailable")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldApplyFallbackTagsCorrectly() {
        // When
        routingMetrics.recordFallback(ChannelType.SMS, ChannelType.PUSH, "provider_unavailable");
        routingMetrics.recordFallback(ChannelType.PUSH, ChannelType.VOICE, "timeout");

        // Then
        Counter smsToPushCounter = meterRegistry.find("routing.fallback.triggered.total")
            .tag("from_channel", "SMS")
            .tag("to_channel", "PUSH")
            .tag("reason", "provider_unavailable")
            .counter();
        
        Counter pushToVoiceCounter = meterRegistry.find("routing.fallback.triggered.total")
            .tag("from_channel", "PUSH")
            .tag("to_channel", "VOICE")
            .tag("reason", "timeout")
            .counter();
        
        assertThat(smsToPushCounter).isNotNull();
        assertThat(smsToPushCounter.count()).isEqualTo(1.0);
        
        assertThat(pushToVoiceCounter).isNotNull();
        assertThat(pushToVoiceCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldIncrementFallbackCounterMultipleTimes() {
        // When
        routingMetrics.recordFallback(ChannelType.SMS, ChannelType.PUSH, "provider_unavailable");
        routingMetrics.recordFallback(ChannelType.SMS, ChannelType.PUSH, "provider_unavailable");

        // Then
        Counter counter = meterRegistry.find("routing.fallback.triggered.total")
            .tag("from_channel", "SMS")
            .tag("to_channel", "PUSH")
            .tag("reason", "provider_unavailable")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(2.0);
    }

    // Helper methods

    private RoutingRule createRoutingRule() {
        return RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("Test Rule")
            .condition("context.amount.value > 100")
            .targetChannel(ChannelType.SMS)
            .priority(1)
            .enabled(true)
            .build();
    }
}


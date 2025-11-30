package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.model.valueobject.ChannelType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Metrics component for routing decision business metrics.
 * 
 * <p>Records Prometheus metrics for:
 * - routing.decisions.total (Counter): Total routing decisions by rule + channel
 * - routing.fallback.triggered.total (Counter): Total fallback triggers by channel transition + reason
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC4)
 * 
 * @author Signature Router Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoutingMetrics {

    private final MeterRegistry meterRegistry;

    /**
     * Records routing decision metrics.
     * 
     * <p>Increments counter: routing.decisions.total
     * Tags:
     * - rule_id: The ID of the routing rule that was matched
     * - channel: SMS|PUSH|VOICE|BIOMETRIC (selected channel)
     * 
     * <p>Example metric:
     * <pre>
     * routing_decisions_total{rule_id="rule-high-value",channel="SMS"} 25.0
     * </pre>
     * 
     * <p>Usage example:
     * <pre>
     * RoutingRule matchedRule = routingEngine.evaluate(context);
     * routingMetrics.recordDecision(matchedRule, selectedChannel);
     * </pre>
     * 
     * @param rule the routing rule that was matched
     * @param selectedChannel the channel selected by the rule
     */
    public void recordDecision(RoutingRule rule, ChannelType selectedChannel) {
        try {
            Counter.builder("routing.decisions.total")
                .description("Total routing decisions by rule")
                .tag("rule_id", rule.getId().toString())
                .tag("channel", selectedChannel.name())
                .register(meterRegistry)
                .increment();
            
            log.debug("Recorded routing decision: ruleId={}, channel={}, ruleName={}", 
                rule.getId(), selectedChannel, rule.getName());
                
        } catch (Exception e) {
            log.error("Failed to record routing decision metric: ruleId={}", rule.getId(), e);
        }
    }

    /**
     * Records fallback trigger metrics.
     * 
     * <p>Increments counter: routing.fallback.triggered.total
     * Tags:
     * - from_channel: SMS|PUSH|VOICE|BIOMETRIC (original channel that failed)
     * - to_channel: SMS|PUSH|VOICE|BIOMETRIC (fallback channel)
     * - reason: PROVIDER_DOWN|TIMEOUT|ERROR|CIRCUIT_OPEN (reason for fallback)
     * 
     * <p>Example metric:
     * <pre>
     * routing_fallback_triggered_total{from_channel="SMS",to_channel="VOICE",reason="PROVIDER_DOWN"} 3.0
     * </pre>
     * 
     * <p>Usage example:
     * <pre>
     * if (smsProviderFailed) {
     *     routingMetrics.recordFallback(ChannelType.SMS, ChannelType.VOICE, "PROVIDER_DOWN");
     * }
     * </pre>
     * 
     * @param fromChannel the original channel that failed
     * @param toChannel the fallback channel
     * @param reason the reason for fallback (PROVIDER_DOWN, TIMEOUT, ERROR, CIRCUIT_OPEN)
     */
    public void recordFallback(ChannelType fromChannel, ChannelType toChannel, String reason) {
        try {
            Counter.builder("routing.fallback.triggered.total")
                .description("Total fallback triggers by channel transition")
                .tag("from_channel", fromChannel.name())
                .tag("to_channel", toChannel.name())
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
            
            log.warn("Recorded fallback trigger: from={}, to={}, reason={}", 
                fromChannel, toChannel, reason);
                
        } catch (Exception e) {
            log.error("Failed to record fallback trigger metric: from={}, to={}", 
                fromChannel, toChannel, e);
        }
    }
}


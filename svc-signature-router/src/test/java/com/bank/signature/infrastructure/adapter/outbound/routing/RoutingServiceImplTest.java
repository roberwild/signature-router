package com.bank.signature.infrastructure.adapter.outbound.routing;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.Money;
import com.bank.signature.domain.model.valueobject.TransactionContext;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.domain.service.RoutingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RoutingServiceImpl.
 * Tests SpEL-based routing rule evaluation.
 *
 * Coverage:
 * - Rule matching with SpEL expressions
 * - Priority-based evaluation (short-circuit)
 * - Default channel fallback
 * - Error handling in rule evaluation
 * - Routing timeline generation
 * - Evaluation context creation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RoutingServiceImpl Tests")
class RoutingServiceImplTest {

    @Mock
    private RoutingRuleRepository routingRuleRepository;

    @InjectMocks
    private RoutingServiceImpl routingService;

    private TransactionContext transactionContext;

    @BeforeEach
    void setUp() {
        // Set default channel via reflection
        ReflectionTestUtils.setField(routingService, "defaultChannelConfig", "SMS");

        // Setup transaction context
        transactionContext = new TransactionContext(
            new Money(BigDecimal.valueOf(1500), "USD"),
            "merchant-123",
            "order-456",
            "Payment for premium subscription"
        );
    }

    @Test
    @DisplayName("Should use default channel when no rules configured")
    void shouldUseDefaultChannel_WhenNoRules() {
        // Given
        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Collections.emptyList());

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.SMS);
        assertThat(decision.defaultChannelUsed()).isTrue();
        assertThat(decision.routingTimeline()).hasSize(1);
        assertThat(decision.routingTimeline().get(0).eventType())
            .isEqualTo("DEFAULT_CHANNEL_USED");

        verify(routingRuleRepository).findAllActiveOrderedByPriority();
    }

    @Test
    @DisplayName("Should match first rule when condition evaluates to true")
    void shouldMatchFirstRule_WhenConditionTrue() {
        // Given
        RoutingRule highAmountRule = createRule(
            UUID.randomUUID(),
            "High Amount → PUSH",
            1,
            "#context.amount.value > 1000",
            ChannelType.PUSH
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(highAmountRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(decision.defaultChannelUsed()).isFalse();
        assertThat(decision.routingTimeline()).hasSize(1);
        assertThat(decision.routingTimeline().get(0).eventType())
            .isEqualTo("RULE_MATCHED");
        assertThat(decision.routingTimeline().get(0).targetChannel())
            .isEqualTo(ChannelType.PUSH);

        verify(routingRuleRepository).findAllActiveOrderedByPriority();
    }

    @Test
    @DisplayName("Should skip non-matching rules and continue evaluation")
    void shouldSkipNonMatchingRules() {
        // Given
        RoutingRule lowAmountRule = createRule(
            UUID.randomUUID(),
            "Low Amount → SMS",
            1,
            "#context.amount.value < 100",  // Won't match (amount is 1500)
            ChannelType.SMS
        );

        RoutingRule highAmountRule = createRule(
            UUID.randomUUID(),
            "High Amount → PUSH",
            2,
            "#context.amount.value > 1000",  // Will match
            ChannelType.PUSH
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Arrays.asList(lowAmountRule, highAmountRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should respect priority order (first matching rule wins)")
    void shouldRespectPriorityOrder() {
        // Given
        RoutingRule priority1 = createRule(
            UUID.randomUUID(),
            "Priority 1 → PUSH",
            1,
            "#context.amount.value > 1000",  // Matches
            ChannelType.PUSH
        );

        RoutingRule priority2 = createRule(
            UUID.randomUUID(),
            "Priority 2 → VOICE",
            2,
            "#context.amount.value > 1000",  // Also matches, but won't be evaluated
            ChannelType.VOICE
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Arrays.asList(priority1, priority2));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should use default channel when no rule matches")
    void shouldUseDefaultChannel_WhenNoRuleMatches() {
        // Given
        RoutingRule lowAmountRule = createRule(
            UUID.randomUUID(),
            "Low Amount → VOICE",
            1,
            "#context.amount.value < 100",  // Won't match
            ChannelType.VOICE
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(lowAmountRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.SMS);
        assertThat(decision.defaultChannelUsed()).isTrue();
        assertThat(decision.routingTimeline().get(0).eventType())
            .isEqualTo("DEFAULT_CHANNEL_USED");
    }

    @Test
    @DisplayName("Should handle rule evaluation error gracefully")
    void shouldHandleRuleEvaluationError() {
        // Given
        RoutingRule invalidRule = createRule(
            UUID.randomUUID(),
            "Invalid Rule",
            1,
            "#context.nonexistent.field > 100",  // Invalid expression
            ChannelType.PUSH
        );

        RoutingRule validRule = createRule(
            UUID.randomUUID(),
            "Valid Rule",
            2,
            "#context.amount.value > 1000",
            ChannelType.VOICE
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Arrays.asList(invalidRule, validRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        // Should skip invalid rule and match valid rule
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.VOICE);
        assertThat(decision.defaultChannelUsed()).isFalse();
        assertThat(decision.routingTimeline())
            .anyMatch(event -> event.eventType().equals("RULE_ERROR"));
    }

    @Test
    @DisplayName("Should evaluate merchant ID condition")
    void shouldEvaluateMerchantIdCondition() {
        // Given
        RoutingRule merchantRule = createRule(
            UUID.randomUUID(),
            "Specific Merchant → BIOMETRIC",
            1,
            "#context.merchantId == 'merchant-123'",
            ChannelType.BIOMETRIC
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(merchantRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.BIOMETRIC);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should evaluate currency condition")
    void shouldEvaluateCurrencyCondition() {
        // Given
        RoutingRule currencyRule = createRule(
            UUID.randomUUID(),
            "USD Transactions → PUSH",
            1,
            "#context.amount.currency == 'USD'",
            ChannelType.PUSH
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(currencyRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should evaluate complex AND condition")
    void shouldEvaluateComplexAndCondition() {
        // Given
        RoutingRule complexRule = createRule(
            UUID.randomUUID(),
            "High USD → VOICE",
            1,
            "#context.amount.value > 1000 && #context.amount.currency == 'USD'",
            ChannelType.VOICE
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(complexRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.VOICE);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should evaluate complex OR condition")
    void shouldEvaluateComplexOrCondition() {
        // Given
        RoutingRule complexRule = createRule(
            UUID.randomUUID(),
            "High Amount OR Specific Merchant → PUSH",
            1,
            "#context.amount.value > 5000 || #context.merchantId == 'merchant-123'",
            ChannelType.PUSH
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(complexRule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(decision.defaultChannelUsed()).isFalse();
    }

    @Test
    @DisplayName("Should include timestamps in routing events")
    void shouldIncludeTimestampsInRoutingEvents() {
        // Given
        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Collections.emptyList());

        Instant before = Instant.now();

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        Instant after = Instant.now();
        assertThat(decision.routingTimeline().get(0).timestamp())
            .isAfterOrEqualTo(before)
            .isBeforeOrEqualTo(after);
    }

    @Test
    @DisplayName("Should use SMS as default channel when configured")
    void shouldUseSmsAsDefaultChannel() {
        // Given
        ReflectionTestUtils.setField(routingService, "defaultChannelConfig", "SMS");
        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Collections.emptyList());

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.SMS);
    }

    @Test
    @DisplayName("Should use PUSH as default channel when configured")
    void shouldUsePushAsDefaultChannel() {
        // Given
        ReflectionTestUtils.setField(routingService, "defaultChannelConfig", "PUSH");
        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Collections.emptyList());

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.PUSH);
    }

    @Test
    @DisplayName("Should fallback to SMS when invalid default channel configured")
    void shouldFallbackToSms_WhenInvalidDefaultChannel() {
        // Given
        ReflectionTestUtils.setField(routingService, "defaultChannelConfig", "INVALID");
        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(Collections.emptyList());

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.selectedChannel()).isEqualTo(ChannelType.SMS);
    }

    @Test
    @DisplayName("Should include rule details in routing event")
    void shouldIncludeRuleDetailsInRoutingEvent() {
        // Given
        RoutingRule rule = createRule(
            UUID.randomUUID(),
            "High Amount Rule",
            1,
            "#context.amount.value > 1000",
            ChannelType.PUSH
        );

        when(routingRuleRepository.findAllActiveOrderedByPriority())
            .thenReturn(List.of(rule));

        // When
        RoutingService.RoutingDecision decision = routingService.evaluate(transactionContext);

        // Then
        assertThat(decision.routingTimeline().get(0).description())
            .contains("High Amount Rule")
            .contains("priority=1")
            .contains("PUSH");
    }

    // Helper method to create mock routing rules
    private RoutingRule createRule(UUID id, String name, int priority,
                                   String condition, ChannelType targetChannel) {
        RoutingRule rule = mock(RoutingRule.class);
        when(rule.getId()).thenReturn(id);
        when(rule.getName()).thenReturn(name);
        when(rule.getPriority()).thenReturn(priority);
        when(rule.getCondition()).thenReturn(condition);
        when(rule.getTargetChannel()).thenReturn(targetChannel);
        return rule;
    }
}

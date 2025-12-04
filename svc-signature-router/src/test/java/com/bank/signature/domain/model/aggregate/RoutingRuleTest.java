package com.bank.signature.domain.model.aggregate;

import com.bank.signature.domain.model.valueobject.ChannelType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for RoutingRule aggregate root.
 * 
 * Story 10.2: Domain Layer Tests - Testing Coverage >90%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Creating routing rule with builder</li>
 *   <li>Validating SpEL condition, target channel, priority</li>
 *   <li>Enabling/disabling rules</li>
 *   <li>Updating rule properties</li>
 * </ul>
 */
@DisplayName("RoutingRule Aggregate Tests")
class RoutingRuleTest {

    private UUID ruleId;
    private String ruleName;
    private String spelCondition;
    private ChannelType targetChannel;
    private Integer priority;
    private Boolean enabled;
    private String createdBy;
    private Instant createdAt;

    @BeforeEach
    void setUp() {
        ruleId = UUID.randomUUID();
        ruleName = "High-value transactions to Voice";
        spelCondition = "context.amount.value > 1000.00";
        targetChannel = ChannelType.VOICE;
        priority = 1;
        enabled = true;
        createdBy = "admin";
        createdAt = Instant.now();
    }

    @Test
    @DisplayName("Should create routing rule with builder")
    void shouldCreateRoutingRuleWithBuilder() {
        // When
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // Then
        assertThat(rule.getId()).isEqualTo(ruleId);
        assertThat(rule.getName()).isEqualTo(ruleName);
        assertThat(rule.getCondition()).isEqualTo(spelCondition);
        assertThat(rule.getTargetChannel()).isEqualTo(targetChannel);
        assertThat(rule.getPriority()).isEqualTo(priority);
        assertThat(rule.getEnabled()).isEqualTo(enabled);
        assertThat(rule.getCreatedBy()).isEqualTo(createdBy);
        assertThat(rule.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    @DisplayName("Should create routing rule with toBuilder")
    void shouldCreateRoutingRuleWithToBuilder() {
        // Given
        RoutingRule originalRule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        RoutingRule updatedRule = originalRule.toBuilder()
            .name("Updated rule name")
            .enabled(false)
            .build();

        // Then
        assertThat(updatedRule.getId()).isEqualTo(ruleId);
        assertThat(updatedRule.getName()).isEqualTo("Updated rule name");
        assertThat(updatedRule.getEnabled()).isFalse();
        assertThat(updatedRule.getCondition()).isEqualTo(spelCondition);
        assertThat(updatedRule.getTargetChannel()).isEqualTo(targetChannel);
    }

    @Test
    @DisplayName("Should create routing rule with different channel types")
    void shouldCreateRoutingRuleWithDifferentChannelTypes() {
        // When
        RoutingRule smsRule = RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("SMS Rule")
            .condition("context.amount.value < 100")
            .targetChannel(ChannelType.SMS)
            .priority(1)
            .enabled(true)
            .createdBy("admin")
            .createdAt(Instant.now())
            .build();

        RoutingRule pushRule = RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("Push Rule")
            .condition("context.amount.value >= 100 && context.amount.value < 1000")
            .targetChannel(ChannelType.PUSH)
            .priority(2)
            .enabled(true)
            .createdBy("admin")
            .createdAt(Instant.now())
            .build();

        // Then
        assertThat(smsRule.getTargetChannel()).isEqualTo(ChannelType.SMS);
        assertThat(pushRule.getTargetChannel()).isEqualTo(ChannelType.PUSH);
    }

    @Test
    @DisplayName("Should create routing rule with different priorities")
    void shouldCreateRoutingRuleWithDifferentPriorities() {
        // When
        RoutingRule highPriorityRule = RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("High Priority")
            .condition("context.merchantId == 'VIP'")
            .targetChannel(ChannelType.VOICE)
            .priority(1)
            .enabled(true)
            .createdBy("admin")
            .createdAt(Instant.now())
            .build();

        RoutingRule lowPriorityRule = RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("Low Priority")
            .condition("true")
            .targetChannel(ChannelType.SMS)
            .priority(100)
            .enabled(true)
            .createdBy("admin")
            .createdAt(Instant.now())
            .build();

        // Then
        assertThat(highPriorityRule.getPriority()).isEqualTo(1);
        assertThat(lowPriorityRule.getPriority()).isEqualTo(100);
        assertThat(highPriorityRule.getPriority()).isLessThan(lowPriorityRule.getPriority());
    }

    @Test
    @DisplayName("Should create disabled routing rule")
    void shouldCreateDisabledRoutingRule() {
        // When
        RoutingRule disabledRule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(false)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // Then
        assertThat(disabledRule.getEnabled()).isFalse();
    }

    @Test
    @DisplayName("Should create routing rule with complex SpEL condition")
    void shouldCreateRoutingRuleWithComplexSpelCondition() {
        // Given
        String complexCondition = "context.amount.value > 1000.00 && context.merchantId == 'MERCHANT_XYZ' && context.orderId != null";

        // When
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name("Complex Rule")
            .condition(complexCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // Then
        assertThat(rule.getCondition()).isEqualTo(complexCondition);
    }

    @Test
    @DisplayName("Should create routing rule with null optional fields")
    void shouldCreateRoutingRuleWithNullOptionalFields() {
        // When
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .build();

        // Then
        assertThat(rule.getId()).isEqualTo(ruleId);
        assertThat(rule.getName()).isEqualTo(ruleName);
        assertThat(rule.getCondition()).isEqualTo(spelCondition);
        assertThat(rule.getTargetChannel()).isEqualTo(targetChannel);
        assertThat(rule.getPriority()).isEqualTo(priority);
        assertThat(rule.getEnabled()).isEqualTo(enabled);
    }

    @Test
    @DisplayName("Should update rule using toBuilder")
    void shouldUpdateRuleUsingToBuilder() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        RoutingRule updatedRule = rule.toBuilder()
            .name("Updated Name")
            .condition("context.amount.value > 2000.00")
            .targetChannel(ChannelType.PUSH)
            .priority(5)
            .enabled(false)
            .build();

        // Then
        assertThat(updatedRule.getId()).isEqualTo(ruleId);
        assertThat(updatedRule.getName()).isEqualTo("Updated Name");
        assertThat(updatedRule.getCondition()).isEqualTo("context.amount.value > 2000.00");
        assertThat(updatedRule.getTargetChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(updatedRule.getPriority()).isEqualTo(5);
        assertThat(updatedRule.getEnabled()).isFalse();
        // Immutable fields should remain the same
        assertThat(updatedRule.getCreatedBy()).isEqualTo(createdBy);
        assertThat(updatedRule.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    @DisplayName("Should enable routing rule")
    void shouldEnableRoutingRule() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(false)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        rule.enable();

        // Then
        assertThat(rule.getEnabled()).isTrue();
    }

    @Test
    @DisplayName("Should disable routing rule")
    void shouldDisableRoutingRule() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(true)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        rule.disable();

        // Then
        assertThat(rule.getEnabled()).isFalse();
    }

    @Test
    @DisplayName("Should throw exception when enabling deleted rule")
    void shouldThrowExceptionWhenEnablingDeletedRule() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(false)
            .deleted(true)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When/Then
        assertThatThrownBy(() -> rule.enable())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot enable a deleted rule");
    }

    @Test
    @DisplayName("Should update routing rule")
    void shouldUpdateRoutingRule() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        rule.update(
            "Updated Name",
            "Updated description",
            "context.amount.value > 2000.00",
            ChannelType.PUSH,
            null, // providerId
            5,
            "admin2"
        );

        // Then
        assertThat(rule.getName()).isEqualTo("Updated Name");
        assertThat(rule.getCondition()).isEqualTo("context.amount.value > 2000.00");
        assertThat(rule.getTargetChannel()).isEqualTo(ChannelType.PUSH);
        assertThat(rule.getPriority()).isEqualTo(5);
        assertThat(rule.getModifiedBy()).isEqualTo("admin2");
        assertThat(rule.getModifiedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should throw exception when updating deleted rule")
    void shouldThrowExceptionWhenUpdatingDeletedRule() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(enabled)
            .deleted(true)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When/Then
        assertThatThrownBy(() -> rule.update(
            "Updated Name",
            "Updated description",
            "context.amount.value > 2000.00",
            ChannelType.PUSH,
            null, // providerId
            5,
            "admin2"
        )).isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("Cannot update a deleted rule");
    }

    @Test
    @DisplayName("Should mark routing rule as deleted")
    void shouldMarkRoutingRuleAsDeleted() {
        // Given
        RoutingRule rule = RoutingRule.builder()
            .id(ruleId)
            .name(ruleName)
            .condition(spelCondition)
            .targetChannel(targetChannel)
            .priority(priority)
            .enabled(true)
            .createdBy(createdBy)
            .createdAt(createdAt)
            .build();

        // When
        rule.markAsDeleted("admin");

        // Then
        assertThat(rule.getDeleted()).isTrue();
        assertThat(rule.getDeletedBy()).isEqualTo("admin");
        assertThat(rule.getDeletedAt()).isNotNull();
        assertThat(rule.getEnabled()).isFalse(); // Should be disabled when deleted
    }
}


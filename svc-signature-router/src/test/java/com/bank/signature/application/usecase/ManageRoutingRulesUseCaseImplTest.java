package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.CreateRoutingRuleDto;
import com.bank.signature.application.dto.UpdateRoutingRuleDto;
import com.bank.signature.application.mapper.RoutingRuleMapper;
import com.bank.signature.application.service.RoutingRuleAuditService;
import com.bank.signature.domain.exception.InvalidSpelExpressionException;
import com.bank.signature.domain.exception.NotFoundException;
import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.model.entity.RoutingRuleAuditLog;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.domain.service.SpelValidatorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ManageRoutingRulesUseCaseImpl.
 * 
 * Story 10.3: Use Case Tests - Testing Coverage >85%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Create rule (happy path, SpEL inválido)</li>
 *   <li>Update rule (happy path, not found, SpEL inválido)</li>
 *   <li>Get rule (happy path, not found)</li>
 *   <li>List rules (happy path, lista vacía)</li>
 *   <li>Delete rule (happy path, not found)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ManageRoutingRulesUseCaseImpl Tests")
class ManageRoutingRulesUseCaseImplTest {

    @Mock
    private RoutingRuleRepository repository;
    @Mock
    private RoutingRuleMapper mapper;
    @Mock
    private SpelValidatorService spelValidator;
    @Mock
    private RoutingRuleAuditService auditService;

    @InjectMocks
    private ManageRoutingRulesUseCaseImpl useCase;

    private UUID ruleId;
    private CreateRoutingRuleDto createDto;
    private UpdateRoutingRuleDto updateDto;
    private RoutingRule routingRule;
    private String createdBy;
    private String modifiedBy;

    @BeforeEach
    void setUp() {
        ruleId = UUID.randomUUID();
        createdBy = "admin";
        modifiedBy = "admin2";
        
        createDto = new CreateRoutingRuleDto(
            "High-value transactions to Voice",
            "context.amount.value > 1000.00",
            ChannelType.VOICE,
            1,
            true
        );

        updateDto = new UpdateRoutingRuleDto(
            "Updated rule name",
            "context.amount.value > 2000.00",
            ChannelType.PUSH,
            5,
            false
        );

        routingRule = RoutingRule.builder()
            .id(ruleId)
            .name("High-value transactions to Voice")
            .condition("context.amount.value > 1000.00")
            .targetChannel(ChannelType.VOICE)
            .priority(1)
            .enabled(true)
            .createdBy(createdBy)
            .createdAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("Should create routing rule successfully")
    void shouldCreateRoutingRuleSuccessfully() {
        // Given
        RoutingRule domainRule = RoutingRule.builder()
            .name(createDto.name())
            .condition(createDto.condition())
            .targetChannel(createDto.targetChannel())
            .priority(createDto.priority())
            .enabled(createDto.enabled())
            .deleted(false)
            .build();

        when(mapper.toDomain(createDto)).thenReturn(domainRule);
        when(repository.save(any(RoutingRule.class))).thenAnswer(invocation -> {
            RoutingRule rule = invocation.getArgument(0);
            return rule.toBuilder().id(ruleId).createdAt(Instant.now()).build();
        });
        when(auditService.getClientIpAddress()).thenReturn("127.0.0.1");
        when(auditService.getUserAgent()).thenReturn("test-agent");

        // When
        RoutingRule result = useCase.createRule(createDto, createdBy);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(ruleId);
        assertThat(result.getName()).isEqualTo(createDto.name());
        assertThat(result.getCondition()).isEqualTo(createDto.condition());
        assertThat(result.getTargetChannel()).isEqualTo(createDto.targetChannel());
        assertThat(result.getPriority()).isEqualTo(createDto.priority());
        assertThat(result.getCreatedBy()).isEqualTo(createdBy);
        
        // Verify interactions
        verify(spelValidator).validate(createDto.condition());
        verify(mapper).toDomain(createDto);
        verify(repository).save(any(RoutingRule.class));
        
        // Verify audit log was saved
        ArgumentCaptor<RoutingRuleAuditLog> auditCaptor = ArgumentCaptor.forClass(RoutingRuleAuditLog.class);
        verify(auditService).save(auditCaptor.capture());
        RoutingRuleAuditLog auditLog = auditCaptor.getValue();
        assertThat(auditLog).isNotNull();
    }

    @Test
    @DisplayName("Should throw exception when creating rule with invalid SpEL")
    void shouldThrowExceptionWhenCreatingRuleWithInvalidSpel() {
        // Given
        CreateRoutingRuleDto invalidDto = new CreateRoutingRuleDto(
            "Invalid Rule",
            "T(java.lang.Runtime).getRuntime().exec('ls')", // Dangerous SpEL
            ChannelType.SMS,
            1,
            true
        );
        
        doThrow(new InvalidSpelExpressionException("Dangerous pattern detected", 0))
            .when(spelValidator).validate(invalidDto.condition());

        // When/Then
        assertThatThrownBy(() -> useCase.createRule(invalidDto, createdBy))
            .isInstanceOf(InvalidSpelExpressionException.class)
            .hasMessageContaining("Dangerous pattern detected");
        
        verify(spelValidator).validate(invalidDto.condition());
        verify(mapper, never()).toDomain(any());
        verify(repository, never()).save(any());
        verify(auditService, never()).save(any());
    }

    @Test
    @DisplayName("Should update routing rule successfully")
    void shouldUpdateRoutingRuleSuccessfully() {
        // Given
        RoutingRule existingRule = routingRule.toBuilder().build();
        RoutingRule updatedRule = existingRule.toBuilder()
            .name(updateDto.name())
            .condition(updateDto.condition())
            .targetChannel(updateDto.targetChannel())
            .priority(updateDto.priority())
            .enabled(updateDto.enabled())
            .modifiedBy(modifiedBy)
            .modifiedAt(Instant.now())
            .build();

        when(repository.findById(ruleId)).thenReturn(Optional.of(existingRule));
        when(repository.save(any(RoutingRule.class))).thenReturn(updatedRule);
        when(auditService.getClientIpAddress()).thenReturn("127.0.0.1");
        when(auditService.getUserAgent()).thenReturn("test-agent");

        // When
        RoutingRule result = useCase.updateRule(ruleId, updateDto, modifiedBy);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(updateDto.name());
        assertThat(result.getCondition()).isEqualTo(updateDto.condition());
        assertThat(result.getTargetChannel()).isEqualTo(updateDto.targetChannel());
        assertThat(result.getPriority()).isEqualTo(updateDto.priority());
        assertThat(result.getModifiedBy()).isEqualTo(modifiedBy);
        
        // Verify interactions
        verify(repository).findById(ruleId);
        verify(spelValidator).validate(updateDto.condition());
        verify(mapper).updateDomain(updateDto, existingRule, modifiedBy);
        verify(repository).save(existingRule);
        
        // Verify audit log was saved
        ArgumentCaptor<RoutingRuleAuditLog> auditCaptor = ArgumentCaptor.forClass(RoutingRuleAuditLog.class);
        verify(auditService).save(auditCaptor.capture());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent rule")
    void shouldThrowExceptionWhenUpdatingNonExistentRule() {
        // Given
        when(repository.findById(ruleId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> useCase.updateRule(ruleId, updateDto, modifiedBy))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("RoutingRule");
        
        verify(repository).findById(ruleId);
        verify(spelValidator, never()).validate(any());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when updating rule with invalid SpEL")
    void shouldThrowExceptionWhenUpdatingRuleWithInvalidSpel() {
        // Given
        UpdateRoutingRuleDto invalidDto = new UpdateRoutingRuleDto(
            "Invalid Rule",
            "T(java.lang.Runtime).getRuntime()", // Dangerous SpEL
            ChannelType.SMS,
            1,
            true
        );
        
        when(repository.findById(ruleId)).thenReturn(Optional.of(routingRule));
        doThrow(new InvalidSpelExpressionException("Dangerous pattern detected", 0))
            .when(spelValidator).validate(invalidDto.condition());

        // When/Then
        assertThatThrownBy(() -> useCase.updateRule(ruleId, invalidDto, modifiedBy))
            .isInstanceOf(InvalidSpelExpressionException.class)
            .hasMessageContaining("Dangerous pattern detected");
        
        verify(repository).findById(ruleId);
        verify(spelValidator).validate(invalidDto.condition());
        verify(mapper, never()).updateDomain(any(), any(), any());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should not validate SpEL when condition unchanged")
    void shouldNotValidateSpelWhenConditionUnchanged() {
        // Given
        UpdateRoutingRuleDto sameConditionDto = new UpdateRoutingRuleDto(
            "Updated name",
            routingRule.getCondition(), // Same condition
            ChannelType.PUSH,
            5,
            false
        );
        
        when(repository.findById(ruleId)).thenReturn(Optional.of(routingRule));
        when(repository.save(any(RoutingRule.class))).thenReturn(routingRule);
        when(auditService.getClientIpAddress()).thenReturn("127.0.0.1");
        when(auditService.getUserAgent()).thenReturn("test-agent");

        // When
        useCase.updateRule(ruleId, sameConditionDto, modifiedBy);

        // Then
        verify(repository).findById(ruleId);
        verify(spelValidator, never()).validate(any()); // Should not validate if unchanged
        verify(mapper).updateDomain(sameConditionDto, routingRule, modifiedBy);
        verify(repository).save(routingRule);
    }

    @Test
    @DisplayName("Should get routing rule by ID successfully")
    void shouldGetRoutingRuleByIdSuccessfully() {
        // Given
        when(repository.findById(ruleId)).thenReturn(Optional.of(routingRule));

        // When
        RoutingRule result = useCase.getRule(ruleId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(ruleId);
        assertThat(result.getName()).isEqualTo(routingRule.getName());
        
        verify(repository).findById(ruleId);
    }

    @Test
    @DisplayName("Should throw exception when getting non-existent rule")
    void shouldThrowExceptionWhenGettingNonExistentRule() {
        // Given
        when(repository.findById(ruleId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> useCase.getRule(ruleId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("RoutingRule");
        
        verify(repository).findById(ruleId);
    }

    @Test
    @DisplayName("Should list all routing rules ordered by priority")
    void shouldListAllRoutingRulesOrderedByPriority() {
        // Given
        List<RoutingRule> rules = new ArrayList<>();
        rules.add(routingRule);
        rules.add(RoutingRule.builder()
            .id(UUID.randomUUID())
            .name("Rule 2")
            .condition("context.amount.value > 500")
            .targetChannel(ChannelType.SMS)
            .priority(2)
            .enabled(true)
            .createdAt(Instant.now())
            .build());
        
        when(repository.findAllOrderedByPriority()).thenReturn(rules);

        // When
        List<RoutingRule> result = useCase.listRules();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPriority()).isLessThan(result.get(1).getPriority());
        
        verify(repository).findAllOrderedByPriority();
    }

    @Test
    @DisplayName("Should return empty list when no rules exist")
    void shouldReturnEmptyListWhenNoRulesExist() {
        // Given
        when(repository.findAllOrderedByPriority()).thenReturn(new ArrayList<>());

        // When
        List<RoutingRule> result = useCase.listRules();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        
        verify(repository).findAllOrderedByPriority();
    }

    @Test
    @DisplayName("Should delete routing rule successfully")
    void shouldDeleteRoutingRuleSuccessfully() {
        // Given
        String deletedBy = "admin";
        when(repository.findById(ruleId)).thenReturn(Optional.of(routingRule));
        when(repository.save(any(RoutingRule.class))).thenReturn(routingRule);
        when(auditService.getClientIpAddress()).thenReturn("127.0.0.1");
        when(auditService.getUserAgent()).thenReturn("test-agent");

        // When
        useCase.deleteRule(ruleId, deletedBy);

        // Then
        assertThat(routingRule.getDeleted()).isTrue();
        assertThat(routingRule.getDeletedBy()).isEqualTo(deletedBy);
        assertThat(routingRule.getEnabled()).isFalse(); // Should be disabled when deleted
        
        verify(repository).findById(ruleId);
        verify(repository).save(routingRule);
        
        // Verify audit log was saved
        ArgumentCaptor<RoutingRuleAuditLog> auditCaptor = ArgumentCaptor.forClass(RoutingRuleAuditLog.class);
        verify(auditService).save(auditCaptor.capture());
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent rule")
    void shouldThrowExceptionWhenDeletingNonExistentRule() {
        // Given
        when(repository.findById(ruleId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> useCase.deleteRule(ruleId, "admin"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("RoutingRule");
        
        verify(repository).findById(ruleId);
        verify(repository, never()).save(any());
        verify(auditService, never()).save(any());
    }
}


package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.domain.model.entity.RoutingRuleAuditLog;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.RoutingRuleAuditLogJpaRepository;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.RoutingRuleAuditLogEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for RoutingRuleAuditService.
 * Critical Improvement #3: Audit Trail
 */
@DisplayName("RoutingRuleAuditService")
class RoutingRuleAuditServiceTest {
    
    private RoutingRuleAuditService service;
    
    @Mock
    private RoutingRuleAuditLogJpaRepository repository;
    
    @Mock
    private com.singularbank.signature.routing.infrastructure.logging.AuditLogger auditLogger;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new RoutingRuleAuditService(repository, auditLogger);
    }
    
    @Test
    @DisplayName("Should save CREATE audit log")
    void shouldSaveCreateAuditLog() {
        // Given
        UUID ruleId = UUID.randomUUID();
        RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.created(
            ruleId,
            "context.amount.value > 1000",
            ChannelType.VOICE,
            10,
            "admin@bank.com",
            "192.168.1.1",
            "Mozilla/5.0"
        );
        
        // When
        service.save(auditLog);
        
        // Then
        ArgumentCaptor<RoutingRuleAuditLogEntity> captor =
            ArgumentCaptor.forClass(RoutingRuleAuditLogEntity.class);
        verify(repository).save(captor.capture());
        
        RoutingRuleAuditLogEntity entity = captor.getValue();
        assertThat(entity.getRuleId()).isEqualTo(ruleId);
        assertThat(entity.getAction()).isEqualTo(RoutingRuleAuditLog.AuditAction.CREATE);
        assertThat(entity.getChangedBy()).isEqualTo("admin@bank.com");
        assertThat(entity.getNewExpression()).isEqualTo("context.amount.value > 1000");
        assertThat(entity.getNewChannel()).isEqualTo(ChannelType.VOICE);
    }
    
    @Test
    @DisplayName("Should save UPDATE audit log with previous and new values")
    void shouldSaveUpdateAuditLog() {
        // Given
        UUID ruleId = UUID.randomUUID();
        RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.updated(
            ruleId,
            "context.amount.value > 1000",
            "context.amount.value > 1500",
            ChannelType.VOICE,
            ChannelType.BIOMETRIC,
            10,
            5,
            "admin@bank.com",
            "192.168.1.1",
            "Mozilla/5.0",
            "Updated threshold"
        );
        
        // When
        service.save(auditLog);
        
        // Then
        ArgumentCaptor<RoutingRuleAuditLogEntity> captor =
            ArgumentCaptor.forClass(RoutingRuleAuditLogEntity.class);
        verify(repository).save(captor.capture());
        
        RoutingRuleAuditLogEntity entity = captor.getValue();
        assertThat(entity.getAction()).isEqualTo(RoutingRuleAuditLog.AuditAction.UPDATE);
        assertThat(entity.getPreviousExpression()).isEqualTo("context.amount.value > 1000");
        assertThat(entity.getNewExpression()).isEqualTo("context.amount.value > 1500");
        assertThat(entity.getPreviousChannel()).isEqualTo(ChannelType.VOICE);
        assertThat(entity.getNewChannel()).isEqualTo(ChannelType.BIOMETRIC);
        assertThat(entity.getChangeReason()).isEqualTo("Updated threshold");
    }
    
    @Test
    @DisplayName("Should save DELETE audit log")
    void shouldSaveDeleteAuditLog() {
        // Given
        UUID ruleId = UUID.randomUUID();
        RoutingRuleAuditLog auditLog = RoutingRuleAuditLog.deleted(
            ruleId,
            "context.amount.value > 1000",
            ChannelType.VOICE,
            10,
            "admin@bank.com",
            "192.168.1.1",
            "Mozilla/5.0",
            "Rule no longer needed"
        );
        
        // When
        service.save(auditLog);
        
        // Then
        ArgumentCaptor<RoutingRuleAuditLogEntity> captor =
            ArgumentCaptor.forClass(RoutingRuleAuditLogEntity.class);
        verify(repository).save(captor.capture());
        
        RoutingRuleAuditLogEntity entity = captor.getValue();
        assertThat(entity.getAction()).isEqualTo(RoutingRuleAuditLog.AuditAction.DELETE);
        assertThat(entity.getPreviousExpression()).isEqualTo("context.amount.value > 1000");
        assertThat(entity.getChangeReason()).isEqualTo("Rule no longer needed");
    }
}


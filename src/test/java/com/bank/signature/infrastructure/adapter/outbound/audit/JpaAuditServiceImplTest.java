package com.bank.signature.infrastructure.adapter.outbound.audit;

import com.bank.signature.domain.model.event.AuditEvent;
import com.bank.signature.domain.model.valueobject.AuditAction;
import com.bank.signature.domain.model.valueobject.AuditEventType;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JpaAuditServiceImpl.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * @since Story 8.4
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JpaAuditServiceImpl Tests")
public class JpaAuditServiceImplTest {
    
    @Mock
    private AuditLogRepository auditLogRepository;
    
    @InjectMocks
    private JpaAuditServiceImpl auditService;
    
    private AuditEvent testEvent;
    
    @BeforeEach
    void setUp() {
        testEvent = new AuditEvent(
                AuditEventType.ACCESS_DENIED,
                "HTTP_REQUEST",
                null,
                AuditAction.SECURITY_EVENT,
                "testuser",
                "ROLE_USER",
                Map.of("path", "/api/v1/admin/rules", "method", "POST"),
                "192.168.1.100",
                "Mozilla/5.0",
                "trace-123"
        );
    }
    
    @Test
    @DisplayName("Should save audit event to repository")
    void shouldSaveAuditEvent() {
        // When
        auditService.log(testEvent);
        
        // Then
        verify(auditLogRepository, times(1)).save(any(AuditLogEntity.class));
    }
    
    @Test
    @DisplayName("Should not throw exception on repository failure")
    void shouldNotThrowExceptionOnRepositoryFailure() {
        // Given
        doThrow(new RuntimeException("Database error")).when(auditLogRepository).save(any());
        
        // When/Then - should not throw
        auditService.log(testEvent);
        
        // Verify that save was attempted
        verify(auditLogRepository, times(1)).save(any(AuditLogEntity.class));
    }
    
    @Test
    @DisplayName("Should map all AuditEvent fields to AuditLogEntity")
    void shouldMapAllFieldsCorrectly() {
        // Given
        AuditEvent event = new AuditEvent(
                AuditEventType.SIGNATURE_CREATED,
                "SIGNATURE_REQUEST",
                UUID.randomUUID(),
                AuditAction.CREATE,
                "admin",
                "ROLE_ADMIN",
                Map.of("status", "PENDING"),
                "10.0.0.1",
                "curl/7.68.0",
                "trace-456"
        );
        
        // When
        auditService.log(event);
        
        // Then
        verify(auditLogRepository).save(argThat(entity ->
                entity.getEventType() == AuditEventType.SIGNATURE_CREATED &&
                entity.getEntityType().equals("SIGNATURE_REQUEST") &&
                entity.getAction() == AuditAction.CREATE &&
                entity.getActor().equals("admin") &&
                entity.getActorRole().equals("ROLE_ADMIN") &&
                entity.getIpAddress().equals("10.0.0.1") &&
                entity.getUserAgent().equals("curl/7.68.0") &&
                entity.getTraceId().equals("trace-456")
        ));
    }
}


package com.bank.signature.infrastructure.adapter.outbound.audit;

import com.bank.signature.domain.model.event.AuditEvent;
import com.bank.signature.domain.port.outbound.AuditService;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.AuditLogEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA-based implementation of AuditService.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Characteristics:</b></p>
 * <ul>
 *   <li><b>Asynchronous:</b> Audit logging does not block business logic (@Async)</li>
 *   <li><b>Immutable:</b> INSERT-only, no UPDATE or DELETE operations</li>
 *   <li><b>Resilient:</b> Exceptions in audit logging do not break business transactions</li>
 *   <li><b>Persistent:</b> PostgreSQL storage with 365-day retention</li>
 * </ul>
 * 
 * <p><b>Transaction Handling:</b></p>
 * <ul>
 *   <li>REQUIRES_NEW: Audit logs persist even if parent transaction rolls back</li>
 *   <li>Exceptions caught and logged (never thrown to caller)</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC7.2: Monitor system components</li>
 *   <li>PCI-DSS Req 10: Track all access to cardholder data</li>
 *   <li>GDPR Art. 30: Records of processing activities</li>
 * </ul>
 * 
 * @since Story 8.4
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JpaAuditServiceImpl implements AuditService {
    
    private final AuditLogRepository auditLogRepository;
    
    /**
     * Logs an audit event to immutable PostgreSQL storage.
     * 
     * <p><b>Asynchronous Execution:</b> Runs in separate thread pool to avoid blocking.</p>
     * <p><b>Error Handling:</b> All exceptions caught and logged (never thrown).</p>
     * <p><b>Transaction Isolation:</b> REQUIRES_NEW propagation ensures audit log
     * persists even if parent transaction rolls back.</p>
     * 
     * @param event The audit event to log
     */
    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditEvent event) {
        try {
            AuditLogEntity entity = AuditLogEntity.builder()
                    .eventType(event.eventType())
                    .entityType(event.entityType())
                    .entityId(event.entityId())
                    .action(event.action())
                    .actor(event.actor())
                    .actorRole(event.actorRole())
                    .changes(event.changes())
                    .ipAddress(event.ipAddress())
                    .userAgent(event.userAgent())
                    .traceId(event.traceId())
                    .build();
            
            auditLogRepository.save(entity);
            
            log.debug("✅ Audit event logged: type={}, entity={}, actor={}, traceId={}",
                    event.eventType(), event.entityType(), event.actor(), event.traceId());
            
        } catch (Exception e) {
            // CRITICAL: Never throw exceptions from audit logging
            // Audit failures must not break business logic
            log.error("❌ Failed to log audit event: type={}, entity={}, actor={}, error={}",
                    event.eventType(), event.entityType(), event.actor(), e.getMessage(), e);
            
            // TODO Story 8.4: Send alert to monitoring system (Prometheus, Datadog, etc.)
            // This indicates a critical infrastructure issue that requires immediate attention
        }
    }
}


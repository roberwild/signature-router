package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.domain.model.entity.RoutingRuleAuditLog;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.RoutingRuleAuditLogJpaRepository;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.RoutingRuleAuditLogEntity;
import com.singularbank.signature.routing.infrastructure.logging.AuditLogger;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing routing rule audit logs.
 * Critical Improvement #3: Audit Trail
 * 
 * <p>Records all changes to routing rules for compliance and troubleshooting.
 * 
 * @since Critical Improvements - Audit Trail
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoutingRuleAuditService {
    
    private final RoutingRuleAuditLogJpaRepository repository;
    private final AuditLogger auditLogger;
    
    /**
     * Save an audit log entry.
     * Uses REQUIRES_NEW to ensure audit is saved even if main transaction rolls back.
     * 
     * @param auditLog the audit log to save
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(RoutingRuleAuditLog auditLog) {
        RoutingRuleAuditLogEntity entity = RoutingRuleAuditLogEntity.fromDomain(auditLog);
        repository.save(entity);
        log.info("Audit log saved: action={}, ruleId={}, changedBy={}",
            auditLog.getAction(), auditLog.getRuleId(), auditLog.getChangedBy());
        
        // Critical Improvement #5: Log to structured audit log
        auditLogger.logRoutingRuleChange(
            auditLog.getAction().name(),
            auditLog.getRuleId().toString(),
            auditLog.getChangedBy(),
            java.util.Map.of(
                "previousExpression", auditLog.getPreviousExpression() != null ? auditLog.getPreviousExpression() : "",
                "newExpression", auditLog.getNewExpression() != null ? auditLog.getNewExpression() : "",
                "reason", auditLog.getChangeReason() != null ? auditLog.getChangeReason() : ""
            )
        );
    }
    
    /**
     * Find all audit logs for a specific rule.
     * 
     * @param ruleId the rule ID
     * @return list of audit logs (most recent first)
     */
    @Transactional(readOnly = true)
    public List<RoutingRuleAuditLog> findByRuleId(UUID ruleId) {
        return repository.findByRuleIdOrderByChangedAtDesc(ruleId).stream()
            .map(RoutingRuleAuditLogEntity::toDomain)
            .collect(Collectors.toList());
    }
    
    /**
     * Find audit logs for a specific rule with pagination.
     * 
     * @param ruleId the rule ID
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    @Transactional(readOnly = true)
    public Page<RoutingRuleAuditLog> findByRuleIdPaginated(UUID ruleId, Pageable pageable) {
        return repository.findByRuleIdOrderByChangedAtDesc(ruleId, pageable)
            .map(RoutingRuleAuditLogEntity::toDomain);
    }
    
    /**
     * Find audit logs by user.
     * 
     * @param changedBy username
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    @Transactional(readOnly = true)
    public Page<RoutingRuleAuditLog> findByUser(String changedBy, Pageable pageable) {
        return repository.findByChangedByOrderByChangedAtDesc(changedBy, pageable)
            .map(RoutingRuleAuditLogEntity::toDomain);
    }
    
    /**
     * Find audit logs within a date range.
     * 
     * @param start start instant
     * @param end end instant
     * @param pageable pagination parameters
     * @return page of audit logs
     */
    @Transactional(readOnly = true)
    public Page<RoutingRuleAuditLog> findByDateRange(Instant start, Instant end, Pageable pageable) {
        return repository.findByDateRange(start, end, pageable)
            .map(RoutingRuleAuditLogEntity::toDomain);
    }
    
    /**
     * Get current username from Spring Security context.
     * 
     * @return username or "SYSTEM" if not authenticated
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }
    
    /**
     * Get current HTTP request for extracting IP and User-Agent.
     * 
     * @return current HTTP request or null
     */
    public HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
    
    /**
     * Get client IP address from current request.
     * 
     * @return IP address or "UNKNOWN"
     */
    public String getClientIpAddress() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return "UNKNOWN";
        }
        
        // Check for proxy headers
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        
        return ipAddress != null ? ipAddress : "UNKNOWN";
    }
    
    /**
     * Get User-Agent from current request.
     * 
     * @return User-Agent or "UNKNOWN"
     */
    public String getUserAgent() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return "UNKNOWN";
        }
        
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "UNKNOWN";
    }
}


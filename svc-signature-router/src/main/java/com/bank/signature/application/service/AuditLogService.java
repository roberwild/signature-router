package com.bank.signature.application.service;

import com.bank.signature.domain.model.entity.AuditLog;
import com.bank.signature.domain.port.outbound.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing comprehensive audit logs.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.2: Audit Service & AOP Interceptor
 * 
 * <p>This service provides methods to record and query audit logs
 * for all CRUD operations in the system.
 * 
 * <p><b>Features:</b>
 * <ul>
 *   <li>Automatic context extraction (username, IP, User-Agent)</li>
 *   <li>REQUIRES_NEW transaction for graceful degradation</li>
 *   <li>Comprehensive search and filtering</li>
 *   <li>Statistics and analytics</li>
 * </ul>
 * 
 * @since Epic 17
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    
    /**
     * Record an audit log entry.
     * Uses REQUIRES_NEW transaction to ensure audit is saved even if main transaction fails.
     * 
     * @param operation the operation type
     * @param entityType the entity type
     * @param entityId the entity ID
     * @param entityName the entity name (for display)
     * @param changes optional map of changes (old → new values)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAudit(
        AuditLog.OperationType operation,
        AuditLog.EntityType entityType,
        String entityId,
        String entityName,
        Map<String, Object> changes
    ) {
        try {
            String username = extractUsername();
            UUID userId = extractUserId();
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            
            AuditLog auditLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .timestamp(Instant.now())
                .userId(userId)
                .username(username)
                .operation(operation)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .changes(changes)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(true)
                .build();
            
            auditLogRepository.save(auditLog);
            
            log.debug("Audit recorded: operation={}, entity={}/{}, user={}",
                operation, entityType, entityId, username);
                
        } catch (Exception e) {
            // Graceful degradation: Don't fail main operation if audit fails
            log.error("Failed to record audit log: operation={}, entityType={}, entityId={}",
                operation, entityType, entityId, e);
        }
    }
    
    /**
     * Record a failed operation audit entry.
     * 
     * @param operation the operation type
     * @param entityType the entity type
     * @param entityId the entity ID
     * @param errorMessage the error message
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedOperation(
        AuditLog.OperationType operation,
        AuditLog.EntityType entityType,
        String entityId,
        String errorMessage
    ) {
        try {
            String username = extractUsername();
            UUID userId = extractUserId();
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            
            AuditLog auditLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .timestamp(Instant.now())
                .userId(userId)
                .username(username)
                .operation(operation)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(false)
                .errorMessage(errorMessage)
                .build();
            
            auditLogRepository.save(auditLog);
            
            log.debug("Failed operation audit recorded: operation={}, entity={}/{}, error={}",
                operation, entityType, entityId, errorMessage);
                
        } catch (Exception e) {
            log.error("Failed to record failed operation audit: {}", e.getMessage());
        }
    }
    
    /**
     * Find all audit logs with pagination.
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
    
    /**
     * Search audit logs with filters.
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> search(
        String username,
        AuditLog.OperationType operation,
        AuditLog.EntityType entityType,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    ) {
        return auditLogRepository.search(username, operation, entityType, startDate, endDate, pageable);
    }
    
    /**
     * Find audit logs for a specific entity.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> findByEntityId(String entityId) {
        return auditLogRepository.findByEntityId(entityId);
    }
    
    /**
     * Get audit statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalLogs", auditLogRepository.count());
        stats.put("createOperations", auditLogRepository.countByOperation(AuditLog.OperationType.CREATE));
        stats.put("updateOperations", auditLogRepository.countByOperation(AuditLog.OperationType.UPDATE));
        stats.put("deleteOperations", auditLogRepository.countByOperation(AuditLog.OperationType.DELETE));
        
        Map<String, Long> byEntityType = new HashMap<>();
        for (AuditLog.EntityType type : AuditLog.EntityType.values()) {
            byEntityType.put(type.name(), auditLogRepository.countByEntityType(type));
        }
        stats.put("byEntityType", byEntityType);
        
        return stats;
    }
    
    // ========================================
    // Context Extraction Helpers
    // ========================================
    
    /**
     * Extract username from Spring Security context.
     */
    private String extractUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                Jwt jwt = jwtAuth.getToken();
                String username = jwt.getClaimAsString("preferred_username");
                if (username != null) return username;
            }
            return auth.getName();
        }
        return "SYSTEM";
    }
    
    /**
     * Extract user ID from JWT token.
     */
    private UUID extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String sub = jwt.getClaimAsString("sub");
            if (sub != null) {
                try {
                    return UUID.fromString(sub);
                } catch (IllegalArgumentException e) {
                    // sub is not a UUID, return null
                    return null;
                }
            }
        }
        return null;
    }
    
    /**
     * Extract IP address from current HTTP request.
     * Supports X-Forwarded-For for proxy scenarios.
     */
    private String extractIpAddress() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return "UNKNOWN";
        
        // Check X-Forwarded-For header (for proxies/load balancers)
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
     * Extract User-Agent from current HTTP request.
     */
    private String extractUserAgent() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return "UNKNOWN";
        
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "UNKNOWN";
    }
    
    /**
     * Get current HTTP request from Spring request context.
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
}


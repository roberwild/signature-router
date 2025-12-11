package com.singularbank.signature.routing.infrastructure.aspect;

import com.singularbank.signature.routing.application.service.AuditLogService;
import com.singularbank.signature.routing.domain.model.entity.AuditLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Audit Aspect - AOP Interceptor for automatic audit logging.
 * Epic 17: Comprehensive Audit Trail
 * Story 17.2: Audit Service & AOP Interceptor
 * 
 * <p>Automatically intercepts CRUD operations in REST controllers and logs them to audit_log.
 * 
 * <p>Uses Spring AOP @Around advice to capture:
 * <ul>
 *   <li>What: Operation type (CREATE/UPDATE/DELETE)</li>
 *   <li>Who: Username from JWT</li>
 *   <li>When: Timestamp</li>
 *   <li>Where: IP address, User-Agent</li>
 *   <li>Result: Success/failure</li>
 * </ul>
 * 
 * @since Epic 17
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {
    
    private final AuditLogService auditLogService;
    
    // ========================================
    // POINTCUTS
    // ========================================
    
    /**
     * Pointcut for all CREATE operations (POST endpoints).
     * Captures controllers in rest.* and rest.admin.* packages.
     */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) && " +
              "execution(* com.singularbank.signature.routing.infrastructure.adapter.inbound.rest..*Controller.create*(..))")
    public void createOperations() {}
    
    /**
     * Pointcut for all UPDATE operations (PUT endpoints).
     * Captures controllers in rest.* and rest.admin.* packages.
     */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.PutMapping) && " +
              "execution(* com.singularbank.signature.routing.infrastructure.adapter.inbound.rest..*Controller.update*(..))")
    public void updateOperations() {}
    
    /**
     * Pointcut for PATCH operations (toggle, partial updates).
     * Captures controllers in rest.* and rest.admin.* packages.
     */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.PatchMapping) && " +
              "execution(* com.singularbank.signature.routing.infrastructure.adapter.inbound.rest..*Controller.*(..))")
    public void patchOperations() {}
    
    /**
     * Pointcut for all DELETE operations (DELETE endpoints).
     * Captures controllers in rest.* and rest.admin.* packages.
     */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.DeleteMapping) && " +
              "execution(* com.singularbank.signature.routing.infrastructure.adapter.inbound.rest..*Controller.delete*(..))")
    public void deleteOperations() {}
    
    // ========================================
    // ADVICE
    // ========================================
    
    /**
     * Intercept CREATE operations.
     */
    @AfterReturning(pointcut = "createOperations()", returning = "result")
    public void auditCreate(JoinPoint joinPoint, Object result) {
        try {
            AuditContext context = extractContext(joinPoint, result);
            
            auditLogService.recordAudit(
                AuditLog.OperationType.CREATE,
                context.entityType(),
                context.entityId(),
                context.entityName(),
                context.changes()
            );
        } catch (Exception e) {
            log.error("Failed to audit CREATE operation: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Intercept UPDATE operations (PUT and PATCH).
     */
    @AfterReturning(pointcut = "updateOperations() || patchOperations()", returning = "result")
    public void auditUpdate(JoinPoint joinPoint, Object result) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            log.debug("AuditAspect intercepted UPDATE: {}.{}", className, methodName);
            
            AuditContext context = extractContext(joinPoint, result);
            
            auditLogService.recordAudit(
                AuditLog.OperationType.UPDATE,
                context.entityType(),
                context.entityId(),
                context.entityName(),
                context.changes()
            );
            
            log.info("Audit UPDATE recorded: entityType={}, entityId={}, user={}", 
                context.entityType(), context.entityId(), extractUsername());
        } catch (Exception e) {
            log.error("Failed to audit UPDATE operation: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Extract current username from security context.
     */
    private String extractUsername() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            if (auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
                org.springframework.security.oauth2.jwt.Jwt jwt = jwtAuth.getToken();
                String username = jwt.getClaimAsString("preferred_username");
                if (username != null) return username;
            }
            return auth.getName();
        }
        return "UNKNOWN";
    }
    
    /**
     * Intercept DELETE operations.
     */
    @AfterReturning(pointcut = "deleteOperations()", returning = "result")
    public void auditDelete(JoinPoint joinPoint, Object result) {
        try {
            AuditContext context = extractContext(joinPoint, result);
            
            auditLogService.recordAudit(
                AuditLog.OperationType.DELETE,
                context.entityType(),
                context.entityId(),
                context.entityName(),
                null // No changes for delete
            );
        } catch (Exception e) {
            log.error("Failed to audit DELETE operation: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Intercept failed operations.
     */
    @AfterThrowing(pointcut = "createOperations() || updateOperations() || patchOperations() || deleteOperations()", throwing = "exception")
    public void auditFailure(JoinPoint joinPoint, Throwable exception) {
        try {
            AuditContext context = extractContext(joinPoint, null);
            AuditLog.OperationType operation = determineOperation(joinPoint);
            
            auditLogService.recordFailedOperation(
                operation,
                context.entityType(),
                context.entityId(),
                exception.getMessage()
            );
        } catch (Exception e) {
            log.error("Failed to audit FAILURE: {}", e.getMessage(), e);
        }
    }
    
    // ========================================
    // HELPERS
    // ========================================
    
    /**
     * Extract audit context from join point and result.
     */
    private AuditContext extractContext(JoinPoint joinPoint, Object result) {
        String controllerName = joinPoint.getTarget().getClass().getSimpleName();
        AuditLog.EntityType entityType = mapControllerToEntityType(controllerName);
        
        String entityId = extractEntityId(joinPoint, result);
        String entityName = extractEntityName(joinPoint, result);
        Map<String, Object> changes = extractChanges(joinPoint);
        
        return new AuditContext(entityType, entityId, entityName, changes);
    }
    
    /**
     * Map controller name to entity type.
     */
    private AuditLog.EntityType mapControllerToEntityType(String controllerName) {
        return switch (controllerName) {
            case "ProviderManagementController" -> AuditLog.EntityType.PROVIDER;
            case "AdminRuleController", "RoutingRuleController" -> AuditLog.EntityType.ROUTING_RULE;
            case "SecurityController", "SecurityAuditController" -> AuditLog.EntityType.SECURITY_SETTING;
            case "AlertController" -> AuditLog.EntityType.ALERT;
            case "UserController" -> AuditLog.EntityType.USER_PROFILE;
            default -> AuditLog.EntityType.CONFIGURATION;
        };
    }
    
    /**
     * Extract entity ID from method parameters or result.
     */
    private String extractEntityId(JoinPoint joinPoint, Object result) {
        // Try to get ID from path variable (for UPDATE/DELETE)
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof UUID uuid) {
                return uuid.toString();
            }
            if (arg instanceof String str && isUUID(str)) {
                return str;
            }
        }
        
        // Try to get ID from result (for CREATE)
        if (result != null) {
            try {
                Method getIdMethod = result.getClass().getMethod("getId");
                Object id = getIdMethod.invoke(result);
                if (id != null) {
                    return id.toString();
                }
            } catch (Exception e) {
                // No getId method or invocation failed
            }
        }
        
        return "UNKNOWN";
    }
    
    /**
     * Extract entity name from result (optional, for better readability).
     */
    private String extractEntityName(JoinPoint joinPoint, Object result) {
        if (result != null) {
            try {
                Method getNameMethod = result.getClass().getMethod("getName");
                Object name = getNameMethod.invoke(result);
                if (name != null) {
                    return name.toString();
                }
            } catch (Exception e) {
                // No getName method
            }
        }
        return null;
    }
    
    /**
     * Extract changes from method parameters (CREATE/UPDATE).
     */
    private Map<String, Object> extractChanges(JoinPoint joinPoint) {
        Map<String, Object> changes = new HashMap<>();
        
        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        
        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            
            // Only capture DTO arguments (skip IDs, etc.)
            if (arg != null && arg.getClass().getPackageName().contains("dto")) {
                String paramName = i < parameterNames.length ? parameterNames[i] : "param" + i;
                changes.put(paramName, arg);
            }
        }
        
        return changes.isEmpty() ? null : changes;
    }
    
    /**
     * Determine operation type from method name.
     */
    private AuditLog.OperationType determineOperation(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        
        if (methodName.startsWith("create")) return AuditLog.OperationType.CREATE;
        if (methodName.startsWith("update")) return AuditLog.OperationType.UPDATE;
        if (methodName.startsWith("delete")) return AuditLog.OperationType.DELETE;
        
        return AuditLog.OperationType.CREATE; // Default
    }
    
    /**
     * Check if string is a valid UUID.
     */
    private boolean isUUID(String str) {
        try {
            UUID.fromString(str);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    
    /**
     * Internal record to hold audit context.
     */
    private record AuditContext(
        AuditLog.EntityType entityType,
        String entityId,
        String entityName,
        Map<String, Object> changes
    ) {}
}


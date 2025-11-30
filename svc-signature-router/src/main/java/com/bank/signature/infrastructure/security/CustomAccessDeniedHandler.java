package com.bank.signature.infrastructure.security;

import com.bank.signature.domain.model.event.AuditEvent;
import com.bank.signature.domain.port.outbound.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Custom Access Denied Handler for RBAC audit logging.
 * Story 8.2: RBAC - Role-Based Access Control
 * 
 * <p><b>Responsibilities:</b></p>
 * <ul>
 *   <li>Log access denied events with user, endpoint, roles, and timestamp</li>
 *   <li>Return standardized HTTP 403 Forbidden JSON response</li>
 *   <li>Emit Prometheus metrics for security dashboards (future: Story 8.4)</li>
 * </ul>
 * 
 * <p><b>Audit Log Format:</b></p>
 * <pre>
 * WARN  - Access denied: user=user@bank.com, path=/api/v1/admin/rules, 
 *         method=POST, roles=[ROLE_USER], requiredRoles=[ROLE_ADMIN, ROLE_SUPPORT]
 * </pre>
 * 
 * @since Story 8.2
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {

        // Extract authentication details
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";
        String roles = authentication != null 
                ? authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.joining(", "))
                : "N/A";

        // Extract request details
        String method = request.getMethod();
        String path = request.getRequestURI();
        String remoteAddr = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        String traceId = MDC.get("traceId");

        // Log access denied event (for Story 8.4: Audit Log - Immutable Storage)
        log.warn("Access denied: user={}, path={}, method={}, roles={}, remoteAddr={}, reason={}",
                username, path, method, roles, remoteAddr, accessDeniedException.getMessage());

        // Story 8.4: Persist to immutable audit_log table
        AuditEvent auditEvent = AuditEvent.accessDenied(
                username,
                roles,
                path,
                method,
                remoteAddr,
                userAgent,
                traceId
        );
        auditService.log(auditEvent);

        // Return HTTP 403 Forbidden with JSON error response
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("status", 403);
        errorResponse.put("error", "Forbidden");
        errorResponse.put("message", "Access denied: insufficient permissions");
        errorResponse.put("path", path);

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}


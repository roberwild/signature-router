package com.bank.signature.infrastructure.filter;

import com.bank.signature.application.service.AuditLogService;
import com.bank.signature.domain.model.entity.AuditLog;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler para registrar intentos de autenticación fallidos en audit_log.
 * 
 * Se ejecuta cuando:
 * - JWT inválido o expirado (401 Unauthorized)
 * - JWT sin roles suficientes (403 Forbidden - manejado por AccessDeniedHandler)
 * - Sin JWT en petición protegida
 * 
 * Epic 17 - Story 17.5: Failed Login Tracking
 * 
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FailedLoginAuditHandler implements AuthenticationEntryPoint {

    private final AuditLogService auditLogService;

    /**
     * Se ejecuta cuando Spring Security rechaza una petición por falta de autenticación.
     * 
     * @param request HTTP request
     * @param response HTTP response
     * @param authException Excepción de autenticación
     */
    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        
        // Intentar extraer información del usuario del JWT (aunque sea inválido)
        String username = "unknown";
        String errorReason = authException.getMessage();
        
        try {
            // Si es OAuth2AuthenticationException, podría tener más info
            if (authException instanceof OAuth2AuthenticationException) {
                OAuth2AuthenticationException oauth2Ex = (OAuth2AuthenticationException) authException;
                errorReason = oauth2Ex.getError().getDescription();
            }
            
            // Intentar extraer username del header Authorization (JWT)
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String jwt = authHeader.substring(7);
                    // Decodificar payload (puede fallar si JWT está corrupto)
                    String[] parts = jwt.split("\\.");
                    if (parts.length > 1) {
                        String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                        // Buscar preferred_username en el JSON
                        if (payload.contains("preferred_username")) {
                            int start = payload.indexOf("preferred_username") + 21; // "preferred_username":"
                            int end = payload.indexOf("\"", start);
                            if (end > start) {
                                username = payload.substring(start, end);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not extract username from JWT: {}", e.getMessage());
                }
            }
            
            // Registrar intento fallido en audit_log
            Map<String, Object> changes = new HashMap<>();
            changes.put("success", false);
            changes.put("error", errorReason);
            changes.put("path", request.getRequestURI());
            changes.put("method", request.getMethod());
            
            auditLogService.recordAudit(
                AuditLog.OperationType.LOGIN,
                AuditLog.EntityType.USER_PROFILE,
                username, // entityId = username que intentó
                username, // entityName
                changes
            );
            
            log.warn("LOGIN_FAILED: user={}, error={}, ip={}", 
                username, 
                errorReason,
                request.getRemoteAddr()
            );
            
        } catch (Exception e) {
            log.error("Error recording failed login audit", e);
        }
        
        // Enviar respuesta 401 Unauthorized
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
            "{\"error\":\"Unauthorized\",\"message\":\"%s\"}", 
            errorReason
        ));
    }
}


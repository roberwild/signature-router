package com.singularbank.signature.routing.infrastructure.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter to populate MDC (Mapped Diagnostic Context) for structured logging.
 * Critical Improvement #5: Structured JSON Logging
 * 
 * <p>Populates MDC with:
 * <ul>
 * <li><strong>traceId:</strong> Unique identifier for request correlation</li>
 * <li><strong>userId:</strong> Authenticated user (from JWT)</li>
 * <li><strong>ipAddress:</strong> Client IP address (considering X-Forwarded-For)</li>
 * <li><strong>userAgent:</strong> Client User-Agent header</li>
 * <li><strong>requestMethod:</strong> HTTP method (GET, POST, etc.)</li>
 * <li><strong>requestUri:</strong> Request URI path</li>
 * </ul>
 * 
 * @since Critical Improvements - Structured JSON Logging
 */
@Component
public class LoggingMdcFilter implements Filter {
    
    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        
        try {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            
            // 1. TraceId - usar header si existe, sino generar nuevo
            String traceId = httpRequest.getHeader(TRACE_ID_HEADER);
            if (traceId == null || traceId.isEmpty()) {
                traceId = UUID.randomUUID().toString();
            }
            MDC.put("traceId", traceId);
            
            // 2. UserId - obtener de Spring Security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) {
                MDC.put("userId", authentication.getName());
            } else {
                MDC.put("userId", "anonymous");
            }
            
            // 3. IP Address - considerar proxy headers
            String ipAddress = getClientIpAddress(httpRequest);
            MDC.put("ipAddress", ipAddress);
            
            // 4. User Agent
            String userAgent = httpRequest.getHeader("User-Agent");
            if (userAgent != null && !userAgent.isEmpty()) {
                MDC.put("userAgent", userAgent);
            }
            
            // 5. Request method and URI
            MDC.put("requestMethod", httpRequest.getMethod());
            MDC.put("requestUri", httpRequest.getRequestURI());
            
            // Continuar con la cadena de filtros
            chain.doFilter(request, response);
            
        } finally {
            // Limpiar MDC después del request para evitar memory leaks
            MDC.clear();
        }
    }
    
    /**
     * Obtener IP real del cliente considerando proxy headers.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader(X_FORWARDED_FOR);
        
        if (ipAddress != null && !ipAddress.isEmpty()) {
            // X-Forwarded-For puede contener múltiples IPs (client, proxy1, proxy2)
            // La primera es la real del cliente
            int commaIndex = ipAddress.indexOf(',');
            if (commaIndex > 0) {
                ipAddress = ipAddress.substring(0, commaIndex).trim();
            }
        }
        
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        
        return ipAddress != null ? ipAddress : "UNKNOWN";
    }
}


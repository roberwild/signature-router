package com.bank.signature.infrastructure.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security Headers configuration for protection against common web vulnerabilities.
 * Story 8.8: Security Headers Configuration
 * 
 * <p><b>Headers Implemented:</b></p>
 * <ul>
 *   <li><b>Content-Security-Policy (CSP):</b> Prevents XSS attacks</li>
 *   <li><b>X-Frame-Options:</b> Prevents clickjacking</li>
 *   <li><b>X-Content-Type-Options:</b> Prevents MIME sniffing</li>
 *   <li><b>X-XSS-Protection:</b> Legacy XSS protection</li>
 *   <li><b>Referrer-Policy:</b> Controls referrer information</li>
 *   <li><b>Permissions-Policy:</b> Controls browser features</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>OWASP Top 10 A05:2021 (Security Misconfiguration)</li>
 *   <li>OWASP Top 10 A03:2021 (Injection)</li>
 * </ul>
 * 
 * @since Story 8.8
 */
@Configuration
public class SecurityHeadersConfig {
    
    /**
     * Filter that adds security headers to all HTTP responses.
     * 
     * @return Security headers filter
     */
    @Bean
    public SecurityHeadersFilter securityHeadersFilter() {
        return new SecurityHeadersFilter();
    }
    
    /**
     * Custom filter for adding security headers.
     */
    public static class SecurityHeadersFilter extends OncePerRequestFilter {
        
        @Override
        protected void doFilterInternal(
                jakarta.servlet.http.HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain) throws ServletException, IOException {
            
            // Content-Security-Policy (CSP) - Prevents XSS and data injection attacks
            // default-src 'self': Only load resources from same origin
            // script-src 'self': Only execute scripts from same origin
            // style-src 'self' 'unsafe-inline': Allow inline styles (for Swagger UI)
            // img-src 'self' data:: Allow images from same origin and data URIs
            // font-src 'self': Only load fonts from same origin
            // connect-src 'self': Only allow AJAX/WebSocket to same origin
            // frame-ancestors 'none': Prevent embedding in frames (same as X-Frame-Options)
            response.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Relaxed for Swagger UI
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self'; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'"
            );
            
            // X-Frame-Options - Prevents clickjacking by disallowing iframe embedding
            response.setHeader("X-Frame-Options", "DENY");
            
            // X-Content-Type-Options - Prevents MIME sniffing
            // Ensures browser respects declared Content-Type
            response.setHeader("X-Content-Type-Options", "nosniff");
            
            // X-XSS-Protection - Legacy XSS protection (modern browsers use CSP)
            // 1; mode=block: Enable XSS filter and block page if attack detected
            response.setHeader("X-XSS-Protection", "1; mode=block");
            
            // Referrer-Policy - Controls how much referrer information is shared
            // strict-origin-when-cross-origin: Send full URL for same-origin, only origin for cross-origin
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Permissions-Policy - Controls browser features (formerly Feature-Policy)
            // Disable potentially dangerous features
            response.setHeader("Permissions-Policy",
                "geolocation=(), " +
                "microphone=(), " +
                "camera=(), " +
                "payment=(), " +
                "usb=(), " +
                "magnetometer=(), " +
                "gyroscope=(), " +
                "accelerometer=()"
            );
            
            // X-Permitted-Cross-Domain-Policies - Restricts Adobe Flash/PDF cross-domain policies
            response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
            
            // Cache-Control for sensitive endpoints (API responses should not be cached)
            String path = request.getRequestURI();
            if (path.startsWith("/api/")) {
                response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
                response.setHeader("Pragma", "no-cache");
                response.setHeader("Expires", "0");
            }
            
            filterChain.doFilter(request, response);
        }
    }
}


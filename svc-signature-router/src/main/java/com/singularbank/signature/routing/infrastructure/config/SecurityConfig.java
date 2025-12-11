package com.singularbank.signature.routing.infrastructure.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.singularbank.signature.routing.infrastructure.filter.FailedLoginAuditHandler;
import com.singularbank.signature.routing.infrastructure.filter.UserProfileSyncFilter;
import com.singularbank.signature.routing.infrastructure.security.CustomAccessDeniedHandler;
import com.singularbank.signature.routing.infrastructure.security.KeycloakJwtAuthenticationConverter;

/**
 * Security configuration for OAuth2 Resource Server with JWT validation.
 * 
 * <p><b>Security Policies:</b></p>
 * <ul>
 *   <li>Public (no auth): /swagger-ui/**, /v3/api-docs/**, /actuator/health, /actuator/prometheus</li>
 *   <li>Authenticated (any role): /api/v1/**</li>
 *   <li>Method-level RBAC: @PreAuthorize on controllers (Story 8.2)</li>
 * </ul>
 * 
 * <p><b>Session Management:</b> Stateless (no server sessions)</p>
 * <p><b>CSRF:</b> Disabled (stateless JWT, Authorization header)</p>
 * <p><b>CORS:</b> Configured for development (localhost:3000, localhost:4200)</p>
 * <p><b>JWT Authentication:</b> Keycloak realm_access.roles → ROLE_* authorities</p>
 * <p><b>Access Denied Handling:</b> CustomAccessDeniedHandler for audit logging</p>
 * 
 * @since Story 1.7 (base), Story 8.1 (OAuth2 Resource Server), Story 8.2 (RBAC)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    /**
     * Register KeycloakJwtAuthenticationConverter as a Spring bean.
     * 
     * @return KeycloakJwtAuthenticationConverter instance
     */
    @Bean
    public KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter() {
        return new KeycloakJwtAuthenticationConverter();
    }
    
    /**
     * Configure security filter chain with JWT authentication and authorization rules.
     * 
     * @param http HttpSecurity configuration
     * @param jwtAuthenticationConverter custom JWT converter for Keycloak roles
     * @param accessDeniedHandler custom handler for access denied events (audit logging)
     * @return SecurityFilterChain bean
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, 
            KeycloakJwtAuthenticationConverter jwtAuthenticationConverter,
            CustomAccessDeniedHandler accessDeniedHandler,
            UserProfileSyncFilter userProfileSyncFilter,
            FailedLoginAuditHandler failedLoginAuditHandler) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no authentication) - Story 8.1 AC9
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                
                // Authenticated endpoints - Story 8.1
                .requestMatchers("/api/v1/**").authenticated()
                
                // Deny all other requests (fail-safe) - Story 8.1 AC6 (SEC-6)
                .anyRequest().denyAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .csrf(csrf -> csrf.disable()) // Stateless JWT, no CSRF needed
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler(accessDeniedHandler) // Story 8.2: RBAC audit logging
                .authenticationEntryPoint(failedLoginAuditHandler) // Story 17.5: Failed login audit
            )
            // Story 8.6: HSTS headers (HTTP Strict Transport Security)
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000) // 1 year
                    .includeSubDomains(true)
                    .preload(true)
                )
            )
            // Story 14.2: User profile sync filter (records user info from JWT on each request)
            .addFilterAfter(userProfileSyncFilter, BearerTokenAuthenticationFilter.class);
        
        return http.build();
    }
    
    /**
     * CORS configuration source for cross-origin requests.
     * 
     * <p><b>Development:</b> Allow localhost:3000 (React), localhost:4200 (Angular)</p>
     * <p><b>Production:</b> Should be configured via application-prod.yml with restrictive origins</p>
     * 
     * @return CorsConfigurationSource bean
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed origins (should be externalized to application.yml)
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",  // React dev server
            "http://localhost:3001",  // Next.js Admin Panel
            "http://localhost:4200"   // Angular dev server
        ));
        
        // Allowed HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Allowed headers
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
        
        // Allow credentials (cookies, auth headers)
        configuration.setAllowCredentials(true);
        
        // Max age (cache preflight response)
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}


package com.bank.signature.infrastructure.config;

import com.bank.signature.infrastructure.config.security.JwtAuthenticationConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security configuration for OAuth2 Resource Server with JWT validation.
 * 
 * <p><b>Security Policies:</b></p>
 * <ul>
 *   <li>Public (no auth): /swagger-ui/**, /v3/api-docs/**, /actuator/health, /api/v1/health</li>
 *   <li>Authenticated (any role): /api/v1/**</li>
 *   <li>Admin only: /api/v1/admin/**</li>
 *   <li>Support or Admin: /api/v1/routing/**</li>
 * </ul>
 * 
 * <p><b>Session Management:</b> Stateless (no server sessions)</p>
 * <p><b>CSRF:</b> Disabled (stateless JWT)</p>
 * <p><b>CORS:</b> Configured for development (localhost:3000, localhost:4200)</p>
 * 
 * @since Story 1.7
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    
    public SecurityConfig(JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }
    
    /**
     * Configure security filter chain with JWT authentication and authorization rules.
     * 
     * @param http HttpSecurity configuration
     * @return SecurityFilterChain bean
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no authentication)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/health").permitAll() // Example endpoint
                
                // Admin-only endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                
                // Support or Admin for routing rules
                .requestMatchers("/api/v1/routing/**").hasAnyRole("ADMIN", "SUPPORT")
                
                // All other /api/v1/** endpoints require authentication
                .requestMatchers("/api/v1/**").authenticated()
                
                // Deny all other requests
                .anyRequest().denyAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .csrf(csrf -> csrf.disable()) // Stateless JWT, no CSRF needed
            .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        
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


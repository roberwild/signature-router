package com.singularbank.signature.routing.infrastructure.config.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom JWT authentication converter for extracting roles from JWT claims.
 * 
 * <p>Converts JWT roles to Spring Security authorities with ROLE_ prefix.</p>
 * 
 * <p><b>Supported Claim Paths:</b></p>
 * <ul>
 *   <li>Simple JWT: "roles" claim (direct array of role strings)</li>
 *   <li>Keycloak: "realm_access.roles" (nested claim path) - TODO: implement if needed</li>
 * </ul>
 * 
 * <p><b>Role Mapping:</b></p>
 * <ul>
 *   <li>"admin" → ROLE_ADMIN</li>
 *   <li>"auditor" → ROLE_AUDITOR</li>
 *   <li>"support" → ROLE_SUPPORT</li>
 *   <li>"user" → ROLE_USER</li>
 * </ul>
 * 
 * @since Story 1.7
 */
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String ROLES_CLAIM = "roles"; // Simple JWT claim
    // For Keycloak: use "realm_access" and extract "roles" from nested Map
    
    /**
     * Convert JWT to Spring Security authentication token with authorities.
     * 
     * @param jwt JWT token
     * @return AbstractAuthenticationToken with extracted roles as authorities
     */
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractRoles(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }
    
    /**
     * Extract roles from JWT claims and convert to Spring Security authorities.
     * 
     * <p>Adds ROLE_ prefix to each role for compatibility with @PreAuthorize("hasRole('ADMIN')").</p>
     * 
     * @param jwt JWT token
     * @return Collection of GrantedAuthority with ROLE_ prefix
     */
    private Collection<GrantedAuthority> extractRoles(Jwt jwt) {
        // Simple JWT with direct "roles" claim
        List<String> roles = jwt.getClaimAsStringList(ROLES_CLAIM);
        
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}


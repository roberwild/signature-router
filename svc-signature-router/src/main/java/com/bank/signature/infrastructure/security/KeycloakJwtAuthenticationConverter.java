package com.bank.signature.infrastructure.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Converts Keycloak JWT to Spring Security authentication token.
 * Extracts roles from 'realm_access.roles' claim and maps to ROLE_* authorities.
 * 
 * <p>Example JWT claim:</p>
 * <pre>
 * {
 *   "realm_access": {
 *     "roles": ["admin", "user"]
 *   }
 * }
 * </pre>
 * 
 * <p>Mapped authorities: ROLE_ADMIN, ROLE_USER</p>
 * 
 * <p>This converter implements OAuth2 Resource Server authentication pattern,
 * extracting realm-level roles from Keycloak JWT tokens and mapping them to
 * Spring Security authorities with the ROLE_ prefix convention.</p>
 * 
 * @see org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
 * @since 1.0.0 (Epic 8 - Story 8.1)
 * @author BMAD Dev Agent
 */
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String ROLES_CLAIM = "roles";
    private static final String PREFERRED_USERNAME_CLAIM = "preferred_username";
    
    /**
     * Converts a Keycloak JWT to an authentication token with roles extracted as authorities.
     * 
     * <p>Process:</p>
     * <ol>
     *   <li>Extract realm_access.roles from JWT claims</li>
     *   <li>Map each role to ROLE_* authority (e.g., "admin" → "ROLE_ADMIN")</li>
     *   <li>Extract preferred_username as principal name</li>
     *   <li>Create JwtAuthenticationToken with authorities and principal</li>
     * </ol>
     * 
     * <p>Graceful degradation: If realm_access or roles claim is missing,
     * returns authentication token with empty authorities (NO NullPointerException).</p>
     * 
     * @param jwt the Keycloak JWT token
     * @return AbstractAuthenticationToken with extracted authorities and principal
     * @throws IllegalArgumentException if jwt is null
     */
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("JWT cannot be null");
        }
        
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String username = jwt.getClaimAsString(PREFERRED_USERNAME_CLAIM);
        
        return new JwtAuthenticationToken(jwt, authorities, username);
    }
    
    /**
     * Extracts authorities from realm_access.roles claim.
     * 
     * <p>Role mapping:</p>
     * <ul>
     *   <li>"admin" → "ROLE_ADMIN"</li>
     *   <li>"user" → "ROLE_USER"</li>
     *   <li>"auditor" → "ROLE_AUDITOR"</li>
     *   <li>"support" → "ROLE_SUPPORT"</li>
     * </ul>
     * 
     * <p>Graceful degradation:</p>
     * <ul>
     *   <li>If realm_access claim is null → empty list</li>
     *   <li>If roles claim is null or empty → empty list</li>
     * </ul>
     * 
     * @param jwt the JWT token
     * @return collection of granted authorities with ROLE_ prefix, or empty list if no roles
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim(REALM_ACCESS_CLAIM);
        if (realmAccess == null) {
            return Collections.emptyList();
        }
        
        List<String> roles = (List<String>) realmAccess.get(ROLES_CLAIM);
        if (roles == null || roles.isEmpty()) {
            return Collections.emptyList();
        }
        
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
            .collect(Collectors.toList());
    }
}


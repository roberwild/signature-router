package com.bank.signature.infrastructure.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Converts Keycloak JWT to Spring Security authentication token.
 * Extracts roles from both 'realm_access.roles' AND
 * 'resource_access.{clientId}.roles'.
 * 
 * <p>
 * Example JWT claims:
 * </p>
 * 
 * <pre>
 * {
 *   "realm_access": {
 *     "roles": ["INTERNAL_USER", "DEV"]
 *   },
 *   "resource_access": {
 *     "2ed840ae-2b4c-41cd-a11d-1202f3790f6f": {
 *       "roles": ["PRF_ADMIN"]
 *     }
 *   }
 * }
 * </pre>
 * 
 * <p>
 * Mapped authorities: ROLE_INTERNAL_USER, ROLE_DEV, ROLE_PRF_ADMIN
 * </p>
 * 
 * @see org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
 * @since 1.0.0 (Epic 8 - Story 8.1)
 * @author BMAD Dev Agent
 */
@Component
@Slf4j
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
    private static final String ROLES_CLAIM = "roles";
    private static final String PREFERRED_USERNAME_CLAIM = "preferred_username";

    /**
     * Converts a Keycloak JWT to an authentication token with roles extracted as
     * authorities.
     * 
     * <p>
     * Process:
     * </p>
     * <ol>
     * <li>Extract realm_access.roles from JWT claims</li>
     * <li>Extract resource_access.{clientId}.roles from JWT claims (client-specific
     * roles)</li>
     * <li>Map each role to ROLE_* authority (e.g., "PRF_ADMIN" →
     * "ROLE_PRF_ADMIN")</li>
     * <li>Extract preferred_username as principal name</li>
     * <li>Create JwtAuthenticationToken with authorities and principal</li>
     * </ol>
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

        log.debug("JWT converted for user '{}' with authorities: {}", username, authorities);

        return new JwtAuthenticationToken(jwt, authorities, username);
    }

    /**
     * Extracts authorities from both realm_access.roles AND
     * resource_access.{clientId}.roles.
     * 
     * <p>
     * This supports both realm-level roles and client-specific roles from
     * Keycloak/AD.
     * </p>
     * 
     * @param jwt the JWT token
     * @return collection of granted authorities with ROLE_ prefix
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // 1. Extract realm-level roles (realm_access.roles)
        Map<String, Object> realmAccess = jwt.getClaim(REALM_ACCESS_CLAIM);
        if (realmAccess != null) {
            List<String> realmRoles = (List<String>) realmAccess.get(ROLES_CLAIM);
            if (realmRoles != null) {
                realmRoles
                        .forEach(role -> authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase())));
                log.trace("Extracted realm roles: {}", realmRoles);
            }
        }

        // 2. Extract client-specific roles (resource_access.{clientId}.roles)
        Map<String, Object> resourceAccess = jwt.getClaim(RESOURCE_ACCESS_CLAIM);
        if (resourceAccess != null) {
            // Iterate over all clients in resource_access
            for (Map.Entry<String, Object> entry : resourceAccess.entrySet()) {
                String clientId = entry.getKey();
                Object clientAccess = entry.getValue();

                if (clientAccess instanceof Map) {
                    Map<String, Object> clientAccessMap = (Map<String, Object>) clientAccess;
                    List<String> clientRoles = (List<String>) clientAccessMap.get(ROLES_CLAIM);

                    if (clientRoles != null) {
                        clientRoles.forEach(
                                role -> authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase())));
                        log.trace("Extracted client '{}' roles: {}", clientId, clientRoles);
                    }
                }
            }
        }

        log.debug("Total authorities extracted: {}", authorities);
        return authorities;
    }
}

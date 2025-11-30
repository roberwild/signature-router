package com.bank.signature.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Arrays;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for KeycloakJwtAuthenticationConverter.
 * 
 * <p>Tests:
 * <ul>
 *   <li>AC4: Role extraction from realm_access.roles</li>
 *   <li>Graceful degradation (null realm_access, null roles)</li>
 *   <li>Multiple roles mapping</li>
 *   <li>ROLE_ prefix and uppercase conversion</li>
 * </ul>
 * 
 * @see KeycloakJwtAuthenticationConverter
 * @since Story 8.1
 */
public class KeycloakJwtAuthenticationConverterTest {
    
    private KeycloakJwtAuthenticationConverter converter;
    
    @BeforeEach
    void setUp() {
        converter = new KeycloakJwtAuthenticationConverter();
    }
    
    /**
     * AC4: JWT with "admin" role → ROLE_ADMIN authority
     */
    @Test
    void testConvert_WithAdminRole_MapsToRoleAdmin() {
        // Given
        Jwt jwt = createJwtWithRoles("admin");
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_ADMIN");
        
        assertThat(token.getName()).isEqualTo("test-user");
    }
    
    /**
     * AC4: JWT with multiple roles → all roles mapped with ROLE_ prefix uppercase
     */
    @Test
    void testConvert_WithMultipleRoles_MapsAllRoles() {
        // Given
        Jwt jwt = createJwtWithRoles("admin", "user", "auditor", "support");
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER", "ROLE_AUDITOR", "ROLE_SUPPORT");
        
        assertThat(token.getAuthorities()).hasSize(4);
    }
    
    /**
     * AC4 (Constraint JWT-4): JWT without realm_access claim → empty authorities (graceful degradation)
     */
    @Test
    void testConvert_WithoutRealmAccess_ReturnsEmptyAuthorities() {
        // Given
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .build();
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities()).isEmpty();
        assertThat(token.getName()).isEqualTo("test-user");
    }
    
    /**
     * AC4 (Constraint JWT-4): JWT with realm_access but null roles → empty authorities (graceful degradation)
     */
    @Test
    void testConvert_WithNullRoles_ReturnsEmptyAuthorities() {
        // Given
        Map<String, Object> realmAccess = Map.of("other_field", "value");
        
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .claim("realm_access", realmAccess)
            .build();
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities()).isEmpty();
    }
    
    /**
     * AC4: JWT with empty roles list → empty authorities
     */
    @Test
    void testConvert_WithEmptyRolesList_ReturnsEmptyAuthorities() {
        // Given
        Map<String, Object> realmAccess = Map.of("roles", Arrays.asList());
        
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .claim("realm_access", realmAccess)
            .build();
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities()).isEmpty();
    }
    
    /**
     * AC4: Null JWT → IllegalArgumentException
     */
    @Test
    void testConvert_WithNullJwt_ThrowsException() {
        // When / Then
        assertThatThrownBy(() -> converter.convert(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("JWT cannot be null");
    }
    
    /**
     * AC4 (Constraint JWT-2): Roles are uppercased (admin → ROLE_ADMIN, user → ROLE_USER)
     */
    @Test
    void testConvert_RolesAreUppercased() {
        // Given
        Jwt jwt = createJwtWithRoles("admin", "user");
        
        // When
        AbstractAuthenticationToken token = converter.convert(jwt);
        
        // Then
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER");
        
        // Verify no lowercase roles
        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .noneMatch(authority -> authority.equals("ROLE_admin") || authority.equals("ROLE_user"));
    }
    
    // Helper methods
    
    /**
     * Creates a JWT with realm_access.roles claim.
     * 
     * @param roles list of roles to include
     * @return Jwt with roles
     */
    private Jwt createJwtWithRoles(String... roles) {
        Map<String, Object> realmAccess = Map.of("roles", Arrays.asList(roles));
        
        return Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .claim("sub", "user123")
            .claim("preferred_username", "test-user")
            .claim("realm_access", realmAccess)
            .build();
    }
}


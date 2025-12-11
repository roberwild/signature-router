package com.singularbank.signature.routing.infrastructure.security;

import com.singularbank.signature.routing.domain.exception.AccessDeniedException;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.port.outbound.PseudonymizationService;
import com.singularbank.signature.routing.application.usecase.QuerySignatureUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Integration tests for Customer Ownership validation.
 * Story 8.3: Pseudonymization Service - Customer-level RBAC
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>AC1: USER can only access own signature requests</li>
 *   <li>AC2: USER cannot access other customers' requests (HTTP 403)</li>
 *   <li>AC3: ADMIN/SUPPORT/AUDITOR can access all requests</li>
 *   <li>AC4: Missing customer_id claim → HTTP 403</li>
 * </ul>
 * 
 * @since Story 8.3
 */
@ExtendWith(MockitoExtension.class)
public class CustomerOwnershipIntegrationTest {

    @Mock
    private PseudonymizationService pseudonymizationService;

    @InjectMocks
    private CustomerOwnershipAspect customerOwnershipAspect;

    private static final String CUSTOMER_ID_1 = "CUST_111111";
    private static final String CUSTOMER_ID_2 = "CUST_222222";
    private static final String PSEUDONYMIZED_ID_1 = "a1b2c3d4e5f6..."; // 64 hex chars (simplified for test)
    private static final String PSEUDONYMIZED_ID_2 = "f6e5d4c3b2a1..."; // Different hash

    @Test
    @DisplayName("AC1: USER with matching customer_id should access own signature request")
    void userCanAccessOwnSignatureRequest() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_1);
        Authentication auth = createUserAuthentication(CUSTOMER_ID_1);
        setSecurityContext(auth);
        
        when(pseudonymizationService.pseudonymize(CUSTOMER_ID_1)).thenReturn(PSEUDONYMIZED_ID_1);
        
        // Act & Assert - Should NOT throw exception
        assertThatCode(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("AC2: USER with different customer_id should be denied (HTTP 403)")
    void userCannotAccessOtherCustomerSignatureRequest() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_2); // Belongs to CUSTOMER_2
        Authentication auth = createUserAuthentication(CUSTOMER_ID_1); // User is CUSTOMER_1
        setSecurityContext(auth);
        
        when(pseudonymizationService.pseudonymize(CUSTOMER_ID_1)).thenReturn(PSEUDONYMIZED_ID_1);
        
        // Act & Assert - Should throw AccessDeniedException
        assertThatThrownBy(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).isInstanceOf(AccessDeniedException.class)
         .hasMessageContaining("You can only access your own signature requests");
    }

    @Test
    @DisplayName("AC3: ADMIN can access any signature request (bypass ownership validation)")
    void adminCanAccessAnySignatureRequest() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_2);
        Authentication auth = createAdminAuthentication();
        setSecurityContext(auth);
        
        // Act & Assert - Should NOT throw exception (ownership check bypassed)
        assertThatCode(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).doesNotThrowAnyException();
        
        // Verify pseudonymization was NOT called (bypass for staff)
        verify(pseudonymizationService, never()).pseudonymize(anyString());
    }

    @Test
    @DisplayName("AC3: SUPPORT can access any signature request (bypass ownership validation)")
    void supportCanAccessAnySignatureRequest() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_1);
        Authentication auth = createSupportAuthentication();
        setSecurityContext(auth);
        
        // Act & Assert - Should NOT throw exception
        assertThatCode(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).doesNotThrowAnyException();
        
        verify(pseudonymizationService, never()).pseudonymize(anyString());
    }

    @Test
    @DisplayName("AC3: AUDITOR can access any signature request (bypass ownership validation)")
    void auditorCanAccessAnySignatureRequest() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_2);
        Authentication auth = createAuditorAuthentication();
        setSecurityContext(auth);
        
        // Act & Assert - Should NOT throw exception
        assertThatCode(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).doesNotThrowAnyException();
        
        verify(pseudonymizationService, never()).pseudonymize(anyString());
    }

    @Test
    @DisplayName("AC4: USER without customer_id claim should be denied (HTTP 403)")
    void userWithoutCustomerIdClaimShouldBeDenied() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_1);
        Authentication auth = createUserAuthenticationWithoutCustomerId();
        setSecurityContext(auth);
        
        // Act & Assert - Should throw AccessDeniedException
        assertThatThrownBy(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).isInstanceOf(AccessDeniedException.class)
         .hasMessageContaining("Customer ID claim missing in token");
    }

    @Test
    @DisplayName("Unauthenticated access should be denied")
    void unauthenticatedAccessShouldBeDenied() {
        // Arrange
        SignatureRequest signatureRequest = createSignatureRequest(PSEUDONYMIZED_ID_1);
        SecurityContextHolder.clearContext(); // No authentication
        
        // Act & Assert - Should throw AccessDeniedException
        assertThatThrownBy(() -> 
            customerOwnershipAspect.validateOwnership(null, signatureRequest)
        ).isInstanceOf(AccessDeniedException.class)
         .hasMessageContaining("Authentication required");
    }

    // ================== Helper Methods ==================

    private SignatureRequest createSignatureRequest(String pseudonymizedCustomerId) {
        return SignatureRequest.builder()
                .id(UUID.randomUUID())
                .customerId(pseudonymizedCustomerId)
                .build();
    }

    private Authentication createUserAuthentication(String customerId) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "user@bank.com")
                .claim("customer_id", customerId)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("user@bank.com");
        when(auth.getPrincipal()).thenReturn(jwt);
        when(auth.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_USER")));
        
        return auth;
    }

    private Authentication createUserAuthenticationWithoutCustomerId() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "user@bank.com")
                // NO customer_id claim
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("user@bank.com");
        when(auth.getPrincipal()).thenReturn(jwt);
        when(auth.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_USER")));
        
        return auth;
    }

    private Authentication createAdminAuthentication() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("admin@bank.com");
        when(auth.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        
        return auth;
    }

    private Authentication createSupportAuthentication() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("support@bank.com");
        when(auth.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_SUPPORT")));
        
        return auth;
    }

    private Authentication createAuditorAuthentication() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("auditor@bank.com");
        when(auth.getAuthorities()).thenAnswer(invocation -> List.of(new SimpleGrantedAuthority("ROLE_AUDITOR")));
        
        return auth;
    }

    private void setSecurityContext(Authentication auth) {
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }
}


package com.singularbank.signature.routing.infrastructure.security;

import com.singularbank.signature.routing.domain.exception.AccessDeniedException;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.port.outbound.PseudonymizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect for enforcing customer-level ownership validation.
 * Story 8.3: Pseudonymization Service - Customer-level RBAC
 * 
 * <p><b>Purpose:</b> Ensure users with ROLE_USER can only access their own signature requests.</p>
 * 
 * <p><b>Mechanism:</b></p>
 * <ol>
 *   <li>Extract customer_id from JWT token (custom claim)</li>
 *   <li>Pseudonymize the customer_id using PseudonymizationService</li>
 *   <li>Compare with SignatureRequest.customerId (stored pseudonymized)</li>
 *   <li>Throw AccessDeniedException if mismatch</li>
 * </ol>
 * 
 * <p><b>Roles Affected:</b></p>
 * <ul>
 *   <li><b>ROLE_USER:</b> Ownership validation enforced</li>
 *   <li><b>ROLE_ADMIN, ROLE_SUPPORT, ROLE_AUDITOR:</b> Bypass validation (full access)</li>
 * </ul>
 * 
 * <p><b>JWT Claim:</b> {@code customer_id} (e.g., "CUST_123456")</p>
 * 
 * <p><b>Example JWT:</b></p>
 * <pre>
 * {
 *   "sub": "john.doe@bank.com",
 *   "realm_access": { "roles": ["user"] },
 *   "customer_id": "CUST_987654321"
 * }
 * </pre>
 * 
 * <p><b>GDPR Compliance:</b></p>
 * <ul>
 *   <li>Art. 5(1)(f): Data integrity and confidentiality</li>
 *   <li>Art. 32: Security of processing (access control)</li>
 * </ul>
 * 
 * @since Story 8.3
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerOwnershipAspect {
    
    private final PseudonymizationService pseudonymizationService;
    
    private static final String CUSTOMER_ID_CLAIM = "customer_id";
    
    /**
     * Validates customer ownership after retrieving a SignatureRequest.
     * 
     * <p>Pointcut: Any method returning SignatureRequest in query use cases.</p>
     * 
     * <p><b>Validation Logic:</b></p>
     * <ol>
     *   <li>Check if user has ROLE_USER (staff roles bypass this check)</li>
     *   <li>Extract customer_id from JWT</li>
     *   <li>Pseudonymize customer_id</li>
     *   <li>Compare with signatureRequest.customerId</li>
     *   <li>Throw AccessDeniedException if mismatch</li>
     * </ol>
     * 
     * @param joinPoint AOP join point
     * @param signatureRequest The returned SignatureRequest
     * @throws AccessDeniedException if user doesn't own the signature request
     */
    @AfterReturning(
        pointcut = "execution(* com.singularbank.signature.routing.application.usecase.QuerySignatureUseCase.execute(..))",
        returning = "signatureRequest"
    )
    public void validateOwnership(JoinPoint joinPoint, SignatureRequest signatureRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Unauthenticated access attempt to signature request: {}", signatureRequest.getId());
            throw new AccessDeniedException("Authentication required to access signature request");
        }
        
        // Skip validation for ADMIN, SUPPORT, AUDITOR (full access)
        if (hasStaffRole(authentication)) {
            log.debug("Staff user {} accessing signature request: {} (ownership validation bypassed)",
                    authentication.getName(), signatureRequest.getId());
            return;
        }
        
        // For ROLE_USER: Validate ownership
        if (hasUserRole(authentication)) {
            validateCustomerOwnership(authentication, signatureRequest);
        }
    }
    
    /**
     * Validates that the authenticated user owns the signature request.
     * 
     * @param authentication Spring Security authentication
     * @param signatureRequest The signature request being accessed
     * @throws AccessDeniedException if customer_id mismatch
     */
    private void validateCustomerOwnership(Authentication authentication, SignatureRequest signatureRequest) {
        String username = authentication.getName();
        
        // Extract customer_id from JWT token
        String customerIdFromJwt = extractCustomerIdFromJwt(authentication);
        
        if (customerIdFromJwt == null || customerIdFromJwt.isBlank()) {
            log.warn("User {} has ROLE_USER but missing customer_id claim in JWT", username);
            throw new AccessDeniedException("Customer ID claim missing in token");
        }
        
        // Pseudonymize the customer_id from JWT
        String pseudonymizedCustomerId = pseudonymizationService.pseudonymize(customerIdFromJwt);
        
        // Compare with stored pseudonymized customer_id
        if (!signatureRequest.getCustomerId().equals(pseudonymizedCustomerId)) {
            log.warn("Ownership validation FAILED: user={}, jwtCustomerId={}, requestCustomerId={}, requestId={}",
                    username,
                    customerIdFromJwt.substring(0, Math.min(4, customerIdFromJwt.length())) + "...",
                    signatureRequest.getCustomerId().substring(0, 8) + "...",
                    signatureRequest.getId());
            
            throw new AccessDeniedException("Access denied: You can only access your own signature requests");
        }
        
        log.debug("Ownership validation SUCCESS: user={}, requestId={}", username, signatureRequest.getId());
    }
    
    /**
     * Extracts customer_id from JWT token.
     * 
     * @param authentication Spring Security authentication
     * @return customer_id claim value (e.g., "CUST_123456")
     */
    private String extractCustomerIdFromJwt(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof Jwt jwt) {
            return jwt.getClaimAsString(CUSTOMER_ID_CLAIM);
        }
        
        log.warn("Principal is not a JWT token: {}", principal.getClass().getName());
        return null;
    }
    
    /**
     * Checks if user has staff role (ADMIN, SUPPORT, AUDITOR).
     * Staff roles have full access and bypass ownership validation.
     * 
     * @param authentication Spring Security authentication
     * @return true if user has staff role
     */
    private boolean hasStaffRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> 
                    authority.getAuthority().equals("ROLE_ADMIN") ||
                    authority.getAuthority().equals("ROLE_SUPPORT") ||
                    authority.getAuthority().equals("ROLE_AUDITOR")
                );
    }
    
    /**
     * Checks if user has USER role.
     * 
     * @param authentication Spring Security authentication
     * @return true if user has USER role
     */
    private boolean hasUserRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_USER"));
    }
}


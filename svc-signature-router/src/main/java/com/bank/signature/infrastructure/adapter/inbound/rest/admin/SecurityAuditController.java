package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.AccessEventResponse;
import com.bank.signature.application.dto.response.SecurityOverviewResponse;
import com.bank.signature.application.service.KeycloakSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Security Audit Controller
 * Story 12.6: Keycloak Security Audit Endpoint
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides security metrics and access audit endpoints.
 * 
 * Endpoints:
 * - GET /api/v1/admin/security/overview - Security overview metrics
 * - GET /api/v1/admin/security/access-audit - Access events audit
 * 
 * Security:
 * - ADMIN or OPERATOR roles required
 * - OAuth2 JWT authentication
 * 
 * Caching:
 * - Security overview cached for 1 minute (frequent access)
 * 
 * @since Story 12.6
 */
@RestController("adminSecurityAuditController")
@RequestMapping("/api/v1/admin/security")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Security Audit", description = "Security metrics and access audit from Keycloak")
@SecurityRequirement(name = "bearer-jwt")
public class SecurityAuditController {
    
    private final KeycloakSecurityService keycloakSecurityService;
    
    /**
     * Get security overview metrics
     * 
     * Returns aggregated security metrics:
     * - Total/enabled users
     * - 2FA adoption percentage
     * - Active tokens
     * - Failed/successful logins (24h)
     * - Overall security status
     * 
     * Security:
     * - Requires ROLE_ADMIN or ROLE_OPERATOR
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but insufficient role
     * 
     * Performance:
     * - Cached for 1 minute (high-frequency access)
     * 
     * @return Security overview
     */
    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Cacheable(value = "securityOverview")
    @Operation(
        summary = "Get security overview",
        description = """
            Returns aggregated security metrics and status.
            
            **Metrics Included:**
            - Total users and enabled users count
            - Two-Factor Authentication (2FA) adoption percentage
            - Active sessions/tokens count
            - Failed login attempts in last 24 hours
            - Successful logins in last 24 hours
            - Overall security status (GOOD/WARNING/CRITICAL)
            
            **Security Status Calculation:**
            - CRITICAL: >50 failed logins/24h OR <50% 2FA adoption
            - WARNING: >20 failed logins/24h OR <70% 2FA adoption
            - GOOD: Otherwise
            
            **Note:** This is a proxy to Keycloak Admin API.
            If keycloak.admin.mock=true, returns mock data.
            
            **Caching:** Results cached for 1 minute.
            
            **Security:**
            - Requires ROLE_ADMIN or ROLE_OPERATOR
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Security overview retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SecurityOverviewResponse.class),
                examples = @ExampleObject(
                    name = "Security Overview Example",
                    value = """
                        {
                          "totalUsers": 150,
                          "enabledUsers": 142,
                          "twoFactorPercentage": 68.5,
                          "activeTokens": 45,
                          "failedLogins24h": 12,
                          "successfulLogins24h": 289,
                          "status": "GOOD"
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Authentication required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - ADMIN or OPERATOR role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<SecurityOverviewResponse> getSecurityOverview() {
        log.info("Getting security overview");
        
        SecurityOverviewResponse overview = keycloakSecurityService.getSecurityOverview();
        
        log.info("Security overview: status={}, failedLogins={}, 2FA={}%",
            overview.status(), overview.failedLogins24h(), overview.twoFactorPercentage());
        
        return ResponseEntity.ok(overview);
    }
    
    /**
     * Get access audit events
     * 
     * Returns list of login/logout events for security audit.
     * Events are ordered by timestamp (most recent first).
     * 
     * Security:
     * - Requires ROLE_ADMIN or ROLE_OPERATOR
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but insufficient role
     * 
     * @param limit Maximum number of events to return (default: 100, max: 500)
     * @return List of access events
     */
    @GetMapping("/access-audit")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(
        summary = "Get access audit events",
        description = """
            Returns list of login/logout events for security audit.
            
            **Event Information:**
            - Event ID and timestamp
            - Event type (LOGIN, LOGOUT, LOGIN_ERROR)
            - Username and user ID
            - IP address
            - Success status
            - Error message (if failed)
            
            **Events Ordering:**
            - Most recent events first
            
            **Limit Parameter:**
            - Default: 100 events
            - Maximum: 500 events
            
            **Use Cases:**
            - Security audit trail
            - Failed login detection
            - Suspicious IP detection
            - User activity monitoring
            
            **Note:** This is a proxy to Keycloak Admin API events.
            If keycloak.admin.mock=true, returns mock events.
            
            **Security:**
            - Requires ROLE_ADMIN or ROLE_OPERATOR
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Access events retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = AccessEventResponse.class)),
                examples = @ExampleObject(
                    name = "Access Events Example",
                    value = """
                        [
                          {
                            "id": "evt-1001",
                            "timestamp": "2025-11-30T10:30:00Z",
                            "eventType": "LOGIN",
                            "username": "admin",
                            "userId": "user-1",
                            "ipAddress": "192.168.1.100",
                            "success": true,
                            "error": null
                          },
                          {
                            "id": "evt-1002",
                            "timestamp": "2025-11-30T10:25:00Z",
                            "eventType": "LOGIN_ERROR",
                            "username": "attacker",
                            "userId": "user-unknown",
                            "ipAddress": "203.0.113.45",
                            "success": false,
                            "error": "Invalid credentials"
                          }
                        ]
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid limit parameter",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Authentication required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - ADMIN or OPERATOR role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<List<AccessEventResponse>> getAccessAudit(
        @Parameter(
            description = "Maximum number of events to return (default: 100, max: 500)",
            example = "100"
        )
        @RequestParam(defaultValue = "100") int limit
    ) {
        log.info("Getting access audit events (limit: {})", limit);
        
        // Validate limit
        if (limit < 1 || limit > 500) {
            log.warn("Invalid limit: {} (must be 1-500)", limit);
            return ResponseEntity.badRequest().build();
        }
        
        List<AccessEventResponse> events = keycloakSecurityService.getAccessAudit(limit);
        
        log.info("Retrieved {} access events", events.size());
        
        return ResponseEntity.ok(events);
    }
}


package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.ProviderListResponse;
import com.bank.signature.application.service.ProviderInventoryService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Providers Controller
 * Story 12.3: Providers Read-Only Endpoint
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides read-only view of configured providers.
 * 
 * Endpoints:
 * - GET /api/v1/admin/providers - List all providers
 * - GET /api/v1/admin/providers/{id} - Get single provider
 * 
 * Security: ADMIN, OPERATOR, or VIEWER role required
 * 
 * Note: This is a READ-ONLY endpoint. CRUD operations for providers
 * would be implemented in future Epic 13 if business requires it.
 * 
 * @since Story 12.3
 */
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Providers", description = "Provider inventory and health status (read-only)")
@SecurityRequirement(name = "bearer-jwt")
public class ProvidersController {
    
    private final ProviderInventoryService providerInventoryService;
    
    /**
     * List all configured providers
     * 
     * Returns list of all providers configured in the system with:
     * - Provider metadata (id, name, type, priority)
     * - Health status (UP/DOWN/DEGRADED, latency)
     * - Masked configuration (no secrets)
     * 
     * Security:
     * - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but missing required role
     * 
     * @return List of providers
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'VIEWER')")
    @Operation(
        summary = "List all providers",
        description = """
            Returns list of all configured providers with health status.
            
            **Provider Information:**
            - ID, name, type (SMS, PUSH, VOICE, BIOMETRIC)
            - Enabled status
            - Priority (lower = higher priority)
            
            **Health Status:**
            - UP, DOWN, or DEGRADED
            - Latency in milliseconds
            - Last health check timestamp
            - Error message (if DOWN)
            
            **Configuration:**
            - Masked credentials (no secrets exposed)
            - Provider-specific settings
            
            **Note:** This is read-only. CRUD operations not implemented.
            Providers are configured via application properties/beans.
            
            **Security:**
            - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Providers retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = ProviderListResponse.class)),
                examples = @ExampleObject(
                    name = "Providers List Example",
                    value = """
                        [
                          {
                            "id": "twilio-sms",
                            "name": "Twilio SMS",
                            "type": "SMS",
                            "enabled": true,
                            "priority": 1,
                            "health": {
                              "status": "UP",
                              "lastCheck": "2025-11-30T10:00:00Z",
                              "latency": 180,
                              "errorMessage": null
                            },
                            "config": {
                              "accountSidMasked": "AC***************",
                              "fromNumber": "+34912345678"
                            }
                          },
                          {
                            "id": "firebase-fcm",
                            "name": "Firebase FCM",
                            "type": "PUSH",
                            "enabled": true,
                            "priority": 1,
                            "health": {
                              "status": "UP",
                              "lastCheck": "2025-11-30T10:00:00Z",
                              "latency": 120,
                              "errorMessage": null
                            },
                            "config": {
                              "serverKeyMasked": "AAAA***************"
                            }
                          }
                        ]
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
            description = "Forbidden - Required role missing",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<List<ProviderListResponse>> listProviders() {
        log.info("Listing all providers");
        
        List<ProviderListResponse> providers = providerInventoryService.getAllProviders();
        
        log.info("Retrieved {} providers", providers.size());
        
        return ResponseEntity.ok(providers);
    }
    
    /**
     * Get single provider by ID
     * 
     * Returns detailed information for a specific provider including
     * health status and masked configuration.
     * 
     * @param id Provider unique identifier
     * @return Provider information
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'VIEWER')")
    @Operation(
        summary = "Get provider by ID",
        description = """
            Returns detailed information for a specific provider.
            
            **Provider IDs:**
            - `twilio-sms` - Twilio SMS provider
            - `firebase-fcm` - Firebase FCM push provider
            - `twilio-voice` - Twilio Voice provider
            - `biocatch` - BioCatch biometric provider
            
            **Security:**
            - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Provider retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ProviderListResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Provider not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Authentication required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Required role missing",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<ProviderListResponse> getProvider(
        @Parameter(description = "Provider unique identifier", example = "twilio-sms")
        @PathVariable String id
    ) {
        log.info("Retrieving provider: {}", id);
        
        try {
            ProviderListResponse provider = providerInventoryService.getProviderById(id);
            return ResponseEntity.ok(provider);
        } catch (IllegalArgumentException e) {
            log.warn("Provider not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
}


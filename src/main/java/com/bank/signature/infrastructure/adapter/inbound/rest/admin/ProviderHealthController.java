package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;
import com.bank.signature.application.service.ProviderHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

/**
 * Provider Health Controller.
 * Story 3.7: Provider Health Check Endpoint
 * 
 * Admin API for checking health status of all signature providers.
 * 
 * Endpoint: GET /api/v1/admin/providers/health
 * Security: ROLE_ADMIN required
 * 
 * Use Cases:
 * - Operations monitoring (Grafana, Datadog, custom dashboards)
 * - Troubleshooting provider connectivity issues
 * - Post-deployment verification
 * - Pre-maintenance health checks
 * 
 * Differences from Spring Actuator:
 * - Custom JSON format with latency, error details, timestamps
 * - Force refresh option (bypass cache)
 * - Separated from /actuator (different firewall rules)
 * - OAuth2 JWT authentication (ROLE_ADMIN)
 * 
 * @since Story 3.7
 */
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Provider Health", description = "Provider health monitoring endpoints (ROLE_ADMIN)")
@SecurityRequirement(name = "bearer-jwt")
public class ProviderHealthController {
    
    private final ProviderHealthService providerHealthService;
    
    /**
     * Gets aggregated health status of all signature providers.
     * 
     * Returns:
     * - Overall status: UP (all up), DEGRADED (some down), DOWN (all down)
     * - Per-provider details: status, latency, error messages
     * - Timestamps for troubleshooting
     * 
     * Query Parameters:
     * - refresh: If true, bypass cache and force fresh health check (default: false)
     * 
     * Security:
     * - ROLE_ADMIN required
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but not ADMIN
     * 
     * HTTP Status:
     * - Always returns HTTP 200 (status in JSON body, not HTTP code)
     * - This allows monitoring tools to distinguish between network errors and provider errors
     * 
     * @param refresh If true, force fresh health check (bypass 30s cache)
     * @return AggregatedHealthResponse with overall status and provider details
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get provider health status",
        description = """
            Returns health status of all signature providers (SMS, Push, Voice, Biometric).
            
            **Overall Status:**
            - `UP`: All providers operational
            - `DEGRADED`: Some providers down (fallback available)
            - `DOWN`: All providers down (system unhealthy)
            
            **Per-Provider Details:**
            - Health status (UP/DOWN)
            - Latency (milliseconds)
            - Error messages (if DOWN)
            - Last check timestamp
            
            **Cache Behavior:**
            - `refresh=false` (default): Uses cached status (30s TTL, fast ~10ms)
            - `refresh=true`: Forces fresh check (slower ~200-500ms, use for troubleshooting)
            
            **Security:**
            - Requires ROLE_ADMIN
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Health status retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AggregatedHealthResponse.class),
                examples = @ExampleObject(
                    name = "Degraded Example",
                    summary = "Some providers down",
                    value = """
                        {
                          "overallStatus": "DEGRADED",
                          "timestamp": "2025-11-27T10:30:00Z",
                          "providers": [
                            {
                              "name": "smsProvider",
                              "type": "SMS",
                              "status": "UP",
                              "details": "Twilio SMS operational",
                              "lastCheckTimestamp": "2025-11-27T10:29:45Z",
                              "latencyMs": 120
                            },
                            {
                              "name": "pushProvider",
                              "type": "PUSH",
                              "status": "UP",
                              "details": "FCM Push operational",
                              "lastCheckTimestamp": "2025-11-27T10:29:45Z",
                              "latencyMs": 85
                            },
                            {
                              "name": "voiceProvider",
                              "type": "VOICE",
                              "status": "DOWN",
                              "details": "Voice provider disabled",
                              "lastCheckTimestamp": "2025-11-27T10:29:45Z",
                              "latencyMs": 5,
                              "errorMessage": "Provider disabled via configuration"
                            }
                          ]
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Authentication required",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                      "timestamp": "2025-11-27T10:30:00Z",
                      "status": 401,
                      "error": "Unauthorized",
                      "message": "Full authentication is required to access this resource",
                      "path": "/api/v1/admin/providers/health"
                    }
                    """)
            )
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - ROLE_ADMIN required",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                      "timestamp": "2025-11-27T10:30:00Z",
                      "status": 403,
                      "error": "Forbidden",
                      "message": "Access Denied",
                      "path": "/api/v1/admin/providers/health"
                    }
                    """)
            )
        )
    })
    public ResponseEntity<AggregatedHealthResponse> getProvidersHealth(
        @RequestParam(defaultValue = "false")
        @Parameter(
            description = "Force refresh (bypass 30s cache)",
            example = "false",
            required = false
        )
        boolean refresh
    ) {
        log.info("Provider health check requested by admin (refresh={})", refresh);
        
        AggregatedHealthResponse healthResponse = providerHealthService.getProvidersHealth(refresh);
        
        log.info("Provider health check completed: overallStatus={}, providers={}",
            healthResponse.overallStatus(), healthResponse.providers().size());
        
        return ResponseEntity.ok(healthResponse);
    }
}


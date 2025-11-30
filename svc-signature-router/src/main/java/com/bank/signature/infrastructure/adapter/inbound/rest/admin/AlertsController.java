package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.request.AlertFilters;
import com.bank.signature.application.dto.response.AlertResponse;
import com.bank.signature.application.service.AlertManagerService;
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
 * Alerts Controller
 * Story 12.7: Prometheus AlertManager Integration
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides endpoints for managing system alerts from Prometheus AlertManager.
 * 
 * Endpoints:
 * - GET /api/v1/admin/alerts - List alerts with filters
 * - GET /api/v1/admin/alerts/{id} - Get alert by ID
 * - PUT /api/v1/admin/alerts/{id}/acknowledge - Acknowledge alert
 * - PUT /api/v1/admin/alerts/{id}/resolve - Resolve alert
 * 
 * Security:
 * - OPERATOR or ADMIN roles required
 * - OAuth2 JWT authentication
 * 
 * Integration:
 * - Proxy to Prometheus AlertManager API
 * - Mock implementation for development (alertmanager.mock=true)
 * 
 * @since Story 12.7
 */
@RestController
@RequestMapping("/api/v1/admin/alerts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Alerts", description = "System alerts from Prometheus AlertManager")
@SecurityRequirement(name = "bearer-jwt")
public class AlertsController {
    
    private final AlertManagerService alertManagerService;
    
    /**
     * List all alerts with optional filters
     * 
     * Returns list of system alerts from Prometheus AlertManager.
     * Results can be filtered by severity and status.
     * Alerts are sorted by severity (CRITICAL > WARNING > INFO) and timestamp (newest first).
     * 
     * Security:
     * - Requires ROLE_OPERATOR or ROLE_ADMIN
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but insufficient role
     * 
     * @param severity Optional filter by severity (CRITICAL, WARNING, INFO)
     * @param status   Optional filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED)
     * @return List of alerts
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    @Operation(
        summary = "List alerts",
        description = """
            Returns list of system alerts from Prometheus AlertManager.
            
            **Alert Information:**
            - ID, name, description
            - Severity (CRITICAL, WARNING, INFO)
            - Status (ACTIVE, ACKNOWLEDGED, RESOLVED)
            - Start and end timestamps
            - Labels and annotations
            
            **Filtering:**
            - By severity: CRITICAL, WARNING, INFO
            - By status: ACTIVE, ACKNOWLEDGED, RESOLVED
            - Combine multiple filters
            
            **Sorting:**
            - Primary: Severity (CRITICAL > WARNING > INFO)
            - Secondary: Timestamp (newest first)
            
            **Alert Severity Levels:**
            - CRITICAL: Immediate action required (service down, high error rate)
            - WARNING: Attention needed (high latency, resource usage)
            - INFO: Informational (SLO degraded, configuration changes)
            
            **Alert Status:**
            - ACTIVE: Alert is firing
            - ACKNOWLEDGED: Alert acknowledged by operator
            - RESOLVED: Alert has been resolved
            
            **Note:** This is a proxy to Prometheus AlertManager API.
            If alertmanager.mock=true, returns mock alerts.
            
            **Security:**
            - Requires ROLE_OPERATOR or ROLE_ADMIN
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Alerts retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = AlertResponse.class)),
                examples = @ExampleObject(
                    name = "Alerts List Example",
                    value = """
                        [
                          {
                            "id": "alert-001",
                            "name": "HighErrorRate",
                            "description": "Error rate above 5% for 5 minutes",
                            "severity": "CRITICAL",
                            "status": "ACTIVE",
                            "startsAt": "2025-11-30T10:15:00Z",
                            "endsAt": null,
                            "labels": {
                              "service": "signature-router",
                              "env": "prod",
                              "alertname": "HighErrorRate"
                            },
                            "annotations": {
                              "summary": "High error rate detected",
                              "description": "Error rate is 8.5% (threshold: 5%)",
                              "runbook": "https://runbook.example.com/high-error-rate"
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
            description = "Forbidden - OPERATOR or ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<List<AlertResponse>> listAlerts(
        @Parameter(description = "Filter by severity", example = "CRITICAL")
        @RequestParam(required = false) String severity,
        
        @Parameter(description = "Filter by status", example = "ACTIVE")
        @RequestParam(required = false) String status
    ) {
        log.info("Listing alerts (severity={}, status={})", severity, status);
        
        AlertFilters filters = AlertFilters.builder()
            .severity(severity)
            .status(status)
            .build();
        
        List<AlertResponse> alerts = alertManagerService.getAlerts(filters);
        
        log.info("Retrieved {} alerts", alerts.size());
        
        return ResponseEntity.ok(alerts);
    }
    
    /**
     * Get single alert by ID
     * 
     * @param id Alert ID
     * @return Alert details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    @Operation(
        summary = "Get alert by ID",
        description = """
            Returns detailed information for a specific alert.
            
            **Use Cases:**
            - View alert details
            - Check alert status
            - Access runbook links
            - View alert labels and annotations
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Alert retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AlertResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Alert not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - OPERATOR or ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<AlertResponse> getAlert(
        @Parameter(description = "Alert ID", example = "alert-001")
        @PathVariable String id
    ) {
        log.info("Getting alert: {}", id);
        
        try {
            AlertResponse alert = alertManagerService.getAlertById(id);
            return ResponseEntity.ok(alert);
        } catch (IllegalArgumentException e) {
            log.warn("Alert not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Acknowledge an alert
     * 
     * Marks the alert as acknowledged to indicate that an operator is aware
     * and working on the issue. In Prometheus AlertManager, this creates a silence.
     * 
     * @param id Alert ID
     * @return No content
     */
    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    @Operation(
        summary = "Acknowledge alert",
        description = """
            Acknowledges an alert to indicate operator awareness.
            
            **What Happens:**
            - Alert status changes from ACTIVE to ACKNOWLEDGED
            - In AlertManager, creates a silence
            - Other operators see the alert is being handled
            
            **Requirements:**
            - Alert must be in ACTIVE status
            - Cannot acknowledge RESOLVED alerts
            
            **Use Cases:**
            - Operator is investigating the issue
            - Working on a fix
            - Waiting for external dependency
            
            **Note:** Acknowledging doesn't resolve the alert, just marks it as known.
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Alert acknowledged successfully"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Alert cannot be acknowledged (not ACTIVE)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Alert not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - OPERATOR or ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<Void> acknowledgeAlert(
        @Parameter(description = "Alert ID", example = "alert-001")
        @PathVariable String id
    ) {
        log.info("Acknowledging alert: {}", id);
        
        try {
            alertManagerService.acknowledgeAlert(id);
            log.info("Alert acknowledged: {}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Alert not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.warn("Cannot acknowledge alert: {} ({})", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Resolve an alert manually
     * 
     * Manually resolves an alert. This is useful when the underlying issue
     * has been fixed but AlertManager hasn't detected it yet, or for manual intervention.
     * 
     * @param id Alert ID
     * @return No content
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    @Operation(
        summary = "Resolve alert manually",
        description = """
            Manually resolves an alert.
            
            **What Happens:**
            - Alert status changes to RESOLVED
            - Sets endsAt timestamp to now
            - Alert removed from active alerts list
            
            **Use Cases:**
            - Issue fixed manually
            - False positive alert
            - AlertManager not detecting resolution
            - Administrative override
            
            **Note:** In most cases, alerts should auto-resolve when metrics return to normal.
            Manual resolution is for special cases.
            
            **Warning:** Use carefully - manual resolution might hide ongoing issues.
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Alert resolved successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Alert not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - OPERATOR or ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<Void> resolveAlert(
        @Parameter(description = "Alert ID", example = "alert-001")
        @PathVariable String id
    ) {
        log.info("Resolving alert: {}", id);
        
        try {
            alertManagerService.resolveAlert(id);
            log.info("Alert resolved: {}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Alert not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
}


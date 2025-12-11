package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.singularbank.signature.routing.application.dto.response.DashboardMetricsResponse;
import com.singularbank.signature.routing.application.usecase.GetDashboardMetricsUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Dashboard Metrics Controller
 * Story 12.1: Dashboard Metrics Endpoint
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides aggregated metrics for the admin dashboard including:
 * - Overview statistics (total signatures, success rate, latency, active
 * providers)
 * - Channel breakdown (SMS, PUSH, VOICE, BIOMETRIC)
 * - Latency timeline (P50, P95, P99) for last 7 days
 * - Error rate timeline for last 7 days
 * 
 * Endpoint: GET /api/v1/admin/dashboard/metrics
 * Security: ADMIN, OPERATOR, or VIEWER role required
 * Cache: 1 minute (Caffeine)
 * 
 * Use Cases:
 * - Admin dashboard overview
 * - Operations monitoring
 * - Executive reporting
 * - Quick health check
 * 
 * @since Story 12.1
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Dashboard", description = "Dashboard metrics and analytics")
@SecurityRequirement(name = "bearer-jwt")
public class DashboardMetricsController {

  private final GetDashboardMetricsUseCase getDashboardMetricsUseCase;

  /**
   * Get aggregated dashboard metrics
   * 
   * Returns comprehensive metrics for the admin dashboard including:
   * - Total signatures (24h, 7d, 30d)
   * - Global success rate
   * - Average latency
   * - Active vs total providers
   * - Channel breakdown (count, success rate, latency per channel)
   * - Latency timeline (P50, P95, P99) for last 7 days
   * - Error rate timeline for last 7 days
   * 
   * Security:
   * - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
   * - HTTP 401 if not authenticated
   * - HTTP 403 if authenticated but missing required role
   * 
   * Performance:
   * - Cached for 60 seconds (configurable via application.yml)
   * - Response time: ~10-50ms (cached), ~200-500ms (cache miss)
   * 
   * @return DashboardMetricsResponse with all aggregated metrics
   */
  @GetMapping("/metrics")
  @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
  @Operation(summary = "Get dashboard metrics", description = """
      Returns aggregated metrics for the admin dashboard.

      **Overview Metrics:**
      - Total signatures (24h, 7d, 30d)
      - Overall success rate (%)
      - Average latency (ms)
      - Active providers count

      **Channel Metrics:**
      - Breakdown by channel (SMS, PUSH, VOICE, BIOMETRIC)
      - Count, success rate, average latency per channel

      **Timeline Data:**
      - Latency (P50, P95, P99) for last 7 days
      - Error rate for last 7 days

      **Performance:**
      - Cached for 60 seconds
      - ~10-50ms response time (cached)

      **Security:**
      - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
      - OAuth2 JWT authentication
      """)
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "Dashboard metrics retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardMetricsResponse.class), examples = @ExampleObject(name = "Dashboard Metrics Example", summary = "Typical dashboard metrics response", value = """
          {
            "overview": {
              "totalSignatures24h": 1234,
              "totalSignatures7d": 8567,
              "totalSignatures30d": 24567,
              "successRate": 94.5,
              "avgLatency": 245,
              "activeProviders": 3,
              "totalProviders": 4
            },
            "byChannel": {
              "SMS": {
                "count": 15000,
                "successRate": 96.2,
                "avgLatency": 180
              },
              "PUSH": {
                "count": 8000,
                "successRate": 92.5,
                "avgLatency": 120
              },
              "VOICE": {
                "count": 1500,
                "successRate": 88.0,
                "avgLatency": 450
              },
              "BIOMETRIC": {
                "count": 67,
                "successRate": 100.0,
                "avgLatency": 90
              }
            },
            "latencyTimeline": [
              {
                "date": "2025-11-24",
                "p50": 150,
                "p95": 420,
                "p99": 780
              },
              {
                "date": "2025-11-25",
                "p50": 145,
                "p95": 430,
                "p99": 750
              }
            ],
            "errorTimeline": [
              {
                "date": "2025-11-24",
                "errorRate": 5.2
              },
              {
                "date": "2025-11-25",
                "errorRate": 4.8
              }
            ]
          }
          """))),
      @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
          {
            "timestamp": "2025-11-30T10:30:00Z",
            "status": 401,
            "error": "Unauthorized",
            "message": "Full authentication is required to access this resource",
            "path": "/api/v1/admin/dashboard/metrics"
          }
          """))),
      @ApiResponse(responseCode = "403", description = "Forbidden - Required role missing", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
          {
            "timestamp": "2025-11-30T10:30:00Z",
            "status": 403,
            "error": "Forbidden",
            "message": "Access Denied",
            "path": "/api/v1/admin/dashboard/metrics"
          }
          """)))
  })
  public ResponseEntity<DashboardMetricsResponse> getDashboardMetrics() {
    log.info("Dashboard metrics requested");

    DashboardMetricsResponse metrics = getDashboardMetricsUseCase.execute();

    log.info("Dashboard metrics returned: total24h={}, successRate={}, channels={}",
        metrics.overview().totalSignatures24h(),
        metrics.overview().successRate(),
        metrics.byChannel().size());

    return ResponseEntity.ok(metrics);
  }
}

package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bank.signature.application.dto.response.MetricsAnalyticsResponse;
import com.bank.signature.application.usecase.GetMetricsAnalyticsUseCase;
import com.bank.signature.domain.model.valueobject.Channel;

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

/**
 * Metrics Analytics Controller
 * Story 12.4: Metrics Analytics Endpoint
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides advanced metrics analytics for the admin panel including:
 * - Latency metrics (P50, P95, P99) with timeline
 * - Throughput (requests/min) with timeline
 * - Error rate overall and by channel with timeline
 * 
 * Endpoint: GET /api/v1/admin/metrics
 * Security: ADMIN, OPERATOR, or VIEWER role required
 * Cache: 5 minutes (Caffeine)
 * 
 * @since Story 12.4
 */
@RestController
@RequestMapping("/api/v1/admin/metrics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Metrics Analytics", description = "Advanced metrics analytics for dashboards")
@SecurityRequirement(name = "bearer-jwt")
public class MetricsAnalyticsController {

  private final GetMetricsAnalyticsUseCase getMetricsAnalyticsUseCase;

  /**
   * Get advanced metrics analytics
   * 
   * Returns advanced metrics including:
   * - Latency percentiles (P50, P95, P99) with daily timeline
   * - Throughput (requests/min) with daily timeline
   * - Error rate (overall + by channel) with daily timeline
   * 
   * Security:
   * - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
   * - HTTP 401 if not authenticated
   * - HTTP 403 if authenticated but missing required role
   * 
   * Performance:
   * - Cached for 5 minutes
   * - Response time: ~20-100ms (cached), ~500ms-1s (cache miss)
   * 
   * @param range   Time range (1d, 7d, 30d) - default: 7d
   * @param channel Optional channel filter
   * @return Metrics analytics response
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
  @Operation(summary = "Get advanced metrics analytics", description = """
      Returns advanced metrics for analytics dashboards.

      **Latency Metrics:**
      - Current P50, P95, P99 latency
      - Daily timeline for specified range

      **Throughput Metrics:**
      - Current requests per minute
      - Daily timeline for specified range

      **Error Rate Metrics:**
      - Overall error rate (%)
      - Error rate by channel (if no channel filter)
      - Daily timeline for specified range

      **Time Ranges:**
      - `1d` - Last 24 hours (daily data points)
      - `7d` - Last 7 days (default)
      - `30d` - Last 30 days

      **Channel Filter:**
      - If specified, filters all metrics to that channel
      - If omitted, shows aggregated metrics across all channels

      **Performance:**
      - Cached for 5 minutes
      - ~20-100ms response time (cached)

      **Security:**
      - Requires ROLE_ADMIN, ROLE_OPERATOR, or ROLE_VIEWER
      - OAuth2 JWT authentication
      """)
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "Metrics analytics retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = MetricsAnalyticsResponse.class), examples = @ExampleObject(name = "Metrics Analytics Example", summary = "7 days metrics with no channel filter", value = """
          {
            "range": "7d",
            "latency": {
              "current": {
                "p50": 150,
                "p95": 450,
                "p99": 780
              },
              "timeline": [
                {
                  "date": "2025-11-24",
                  "p50": 145,
                  "p95": 420,
                  "p99": 750
                },
                {
                  "date": "2025-11-25",
                  "p50": 150,
                  "p95": 430,
                  "p99": 780
                }
              ]
            },
            "throughput": {
              "current": 120.5,
              "timeline": [
                {
                  "date": "2025-11-24",
                  "requestsPerMinute": 115.2
                },
                {
                  "date": "2025-11-25",
                  "requestsPerMinute": 118.7
                }
              ]
            },
            "errorRate": {
              "overall": 5.5,
              "byChannel": {
                "SMS": 3.8,
                "PUSH": 7.5,
                "VOICE": 12.0,
                "BIOMETRIC": 0.0
              },
              "timeline": [
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
          }
          """))),
      @ApiResponse(responseCode = "400", description = "Invalid range parameter", content = @Content(mediaType = "application/json")),
      @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required", content = @Content(mediaType = "application/json")),
      @ApiResponse(responseCode = "403", description = "Forbidden - Required role missing", content = @Content(mediaType = "application/json"))
  })
  public ResponseEntity<MetricsAnalyticsResponse> getMetricsAnalytics(
      @Parameter(description = "Time range for metrics", example = "7d", schema = @Schema(allowableValues = { "1d",
          "7d", "30d" })) @RequestParam(defaultValue = "7d") String range,

      @Parameter(description = "Optional channel filter", example = "SMS") @RequestParam(required = false) Channel channel) {
    // Validate range
    if (!range.matches("^(1d|7d|30d)$")) {
      log.warn("Invalid range parameter: {}", range);
      range = "7d"; // Default to 7d if invalid
    }

    log.info("Metrics analytics requested: range={}, channel={}", range, channel);

    MetricsAnalyticsResponse response = getMetricsAnalyticsUseCase.execute(range, channel);

    log.info("Metrics analytics returned: range={}, channel={}", response.range(), channel);

    return ResponseEntity.ok(response);
  }
}

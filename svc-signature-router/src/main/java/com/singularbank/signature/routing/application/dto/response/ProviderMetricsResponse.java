package com.singularbank.signature.routing.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Provider Metrics Response DTO.
 * Epic 14: Frontend-Backend Integration - Provider Metrics
 * 
 * Contains operational metrics for a signature provider, including:
 * - Request counts and success rates (internal metrics)
 * - Response times and latency (from MuleSoft when available)
 * - Uptime and availability (from MuleSoft health checks)
 * - Cost information (from MuleSoft when available)
 * 
 * NOTE: Some metrics will come from MuleSoft API Gateway once integration is complete.
 * Until then, mock data is returned for development/testing purposes.
 * 
 * @since Epic 14
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Operational metrics for a signature provider")
public record ProviderMetricsResponse(
    
    @Schema(description = "Provider ID", example = "550e8400-e29b-41d4-a716-446655440000")
    @JsonProperty("provider_id")
    UUID providerId,
    
    @Schema(description = "Provider name", example = "Twilio SMS")
    @JsonProperty("provider_name")
    String providerName,
    
    // ========================================
    // Request Metrics (Internal - from signature_requests table)
    // ========================================
    
    @Schema(description = "Total requests processed today (since midnight UTC)", example = "8521")
    @JsonProperty("requests_today")
    long requestsToday,
    
    @Schema(description = "Total requests processed in the last 7 days", example = "52340")
    @JsonProperty("requests_7d")
    long requests7d,
    
    @Schema(description = "Total requests processed in the last 30 days", example = "198450")
    @JsonProperty("requests_30d")
    long requests30d,
    
    @Schema(description = "Success rate percentage (0-100)", example = "98.9")
    @JsonProperty("success_rate")
    double successRate,
    
    @Schema(description = "Failed requests today", example = "94")
    @JsonProperty("failed_requests_today")
    long failedRequestsToday,
    
    // ========================================
    // Latency Metrics (From MuleSoft - mocked until integration)
    // ========================================
    
    @Schema(description = "Average response time in seconds", example = "1.2")
    @JsonProperty("avg_response_time")
    double avgResponseTime,
    
    @Schema(description = "P50 latency in milliseconds", example = "95")
    @JsonProperty("latency_p50_ms")
    Long latencyP50Ms,
    
    @Schema(description = "P95 latency in milliseconds", example = "250")
    @JsonProperty("latency_p95_ms")
    Long latencyP95Ms,
    
    @Schema(description = "P99 latency in milliseconds", example = "450")
    @JsonProperty("latency_p99_ms")
    Long latencyP99Ms,
    
    // ========================================
    // Availability Metrics (From MuleSoft - mocked until integration)
    // ========================================
    
    @Schema(description = "Uptime percentage in the last 24 hours (0-100)", example = "99.9")
    double uptime,
    
    @Schema(description = "Number of health check failures in last 24h", example = "2")
    @JsonProperty("health_check_failures_24h")
    int healthCheckFailures24h,
    
    @Schema(description = "Time since last successful health check in seconds", example = "45")
    @JsonProperty("seconds_since_last_health_check")
    long secondsSinceLastHealthCheck,
    
    // ========================================
    // Cost Metrics (From MuleSoft - mocked until integration)
    // ========================================
    
    @Schema(description = "Cost per request in EUR", example = "0.05")
    @JsonProperty("cost_per_request_eur")
    BigDecimal costPerRequestEur,
    
    @Schema(description = "Total cost today in EUR", example = "426.05")
    @JsonProperty("total_cost_today_eur")
    BigDecimal totalCostTodayEur,
    
    @Schema(description = "Total cost this month in EUR", example = "12580.50")
    @JsonProperty("total_cost_month_eur")
    BigDecimal totalCostMonthEur,
    
    // ========================================
    // MuleSoft Integration Metadata
    // ========================================
    
    @Schema(description = "Whether metrics come from MuleSoft (true) or are mocked (false)", example = "false")
    @JsonProperty("mulesoft_integrated")
    boolean mulesoftIntegrated,
    
    @Schema(description = "MuleSoft provider identifier (when integrated)", example = "TWILIO_US")
    @JsonProperty("mulesoft_provider_id")
    String mulesoftProviderId,
    
    @Schema(description = "Timestamp when metrics were calculated", example = "2025-12-03T10:30:00Z")
    @JsonProperty("calculated_at")
    Instant calculatedAt
) {
    
    /**
     * Creates a builder with mock data for development/testing.
     * This will be replaced with real MuleSoft data once integration is complete.
     */
    public static ProviderMetricsResponseBuilder mockBuilder(UUID providerId, String providerName) {
        return ProviderMetricsResponse.builder()
            .providerId(providerId)
            .providerName(providerName)
            .mulesoftIntegrated(false)
            .calculatedAt(Instant.now());
    }
}


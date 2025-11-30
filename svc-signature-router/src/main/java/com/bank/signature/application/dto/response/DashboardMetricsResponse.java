package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * Dashboard Metrics Response DTO
 * Story 12.1: Dashboard Metrics Endpoint
 * 
 * Comprehensive metrics for admin dashboard including:
 * - Overview statistics (total signatures, success rate, latency, providers)
 * - Channel breakdown (SMS, PUSH, VOICE, BIOMETRIC)
 * - Latency timeline (P50, P95, P99)
 * - Error rate timeline
 */
@Builder
@Schema(description = "Dashboard metrics aggregated data")
public record DashboardMetricsResponse(
    
    @Schema(description = "Overview metrics for dashboard cards")
    OverviewMetrics overview,
    
    @Schema(description = "Metrics broken down by channel")
    Map<String, ChannelMetrics> byChannel,
    
    @Schema(description = "Latency timeline for the last 7 days")
    List<LatencyTimelinePoint> latencyTimeline,
    
    @Schema(description = "Error rate timeline for the last 7 days")
    List<ErrorTimelinePoint> errorTimeline
) {
    
    /**
     * Overview Metrics - Top-level KPIs
     */
    @Builder
    @Schema(description = "Overview metrics")
    public record OverviewMetrics(
        @Schema(description = "Total signatures in last 24 hours", example = "1234")
        long totalSignatures24h,
        
        @Schema(description = "Total signatures in last 7 days", example = "8567")
        long totalSignatures7d,
        
        @Schema(description = "Total signatures in last 30 days", example = "24567")
        long totalSignatures30d,
        
        @Schema(description = "Overall success rate percentage", example = "94.5")
        double successRate,
        
        @Schema(description = "Average latency in milliseconds", example = "245")
        long avgLatency,
        
        @Schema(description = "Number of active providers", example = "3")
        int activeProviders,
        
        @Schema(description = "Total number of providers", example = "4")
        int totalProviders
    ) {}
    
    /**
     * Channel Metrics - Per-channel statistics
     */
    @Builder
    @Schema(description = "Metrics for a specific channel")
    public record ChannelMetrics(
        @Schema(description = "Total signatures for this channel", example = "15000")
        long count,
        
        @Schema(description = "Success rate for this channel", example = "96.2")
        double successRate,
        
        @Schema(description = "Average latency for this channel in ms", example = "180")
        long avgLatency
    ) {}
    
    /**
     * Latency Timeline Point
     */
    @Builder
    @Schema(description = "Latency metrics for a specific date")
    public record LatencyTimelinePoint(
        @Schema(description = "Date in YYYY-MM-DD format", example = "2025-11-24")
        String date,
        
        @Schema(description = "P50 latency in milliseconds", example = "150")
        long p50,
        
        @Schema(description = "P95 latency in milliseconds", example = "420")
        long p95,
        
        @Schema(description = "P99 latency in milliseconds", example = "780")
        long p99
    ) {}
    
    /**
     * Error Timeline Point
     */
    @Builder
    @Schema(description = "Error rate for a specific date")
    public record ErrorTimelinePoint(
        @Schema(description = "Date in YYYY-MM-DD format", example = "2025-11-24")
        String date,
        
        @Schema(description = "Error rate percentage", example = "5.2")
        double errorRate
    ) {}
}


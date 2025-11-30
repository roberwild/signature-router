package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * Metrics Analytics Response DTO
 * Story 12.4: Metrics Analytics Endpoint
 * 
 * Advanced metrics for analytics dashboard with latency, throughput, and error rates
 */
@Builder
@Schema(description = "Advanced metrics analytics data")
public record MetricsAnalyticsResponse(
    
    @Schema(description = "Time range for metrics", example = "7d", allowableValues = {"1d", "7d", "30d"})
    String range,
    
    @Schema(description = "Latency metrics with timeline")
    LatencyMetrics latency,
    
    @Schema(description = "Throughput metrics with timeline")
    ThroughputMetrics throughput,
    
    @Schema(description = "Error rate metrics with timeline")
    ErrorRateMetrics errorRate
) {
    
    /**
     * Latency Metrics
     */
    @Builder
    @Schema(description = "Latency percentiles and timeline")
    public record LatencyMetrics(
        @Schema(description = "Current latency percentiles")
        CurrentLatency current,
        
        @Schema(description = "Latency timeline")
        List<LatencyTimelinePoint> timeline
    ) {
        @Builder
        @Schema(description = "Current latency percentiles")
        public record CurrentLatency(
            @Schema(description = "P50 latency in ms", example = "150")
            long p50,
            
            @Schema(description = "P95 latency in ms", example = "450")
            long p95,
            
            @Schema(description = "P99 latency in ms", example = "780")
            long p99
        ) {}
        
        @Builder
        @Schema(description = "Latency timeline point")
        public record LatencyTimelinePoint(
            @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24")
            String date,
            
            @Schema(description = "P50 latency in ms", example = "145")
            long p50,
            
            @Schema(description = "P95 latency in ms", example = "420")
            long p95,
            
            @Schema(description = "P99 latency in ms", example = "750")
            long p99
        ) {}
    }
    
    /**
     * Throughput Metrics
     */
    @Builder
    @Schema(description = "Throughput metrics and timeline")
    public record ThroughputMetrics(
        @Schema(description = "Current throughput (requests/min)", example = "120")
        double current,
        
        @Schema(description = "Throughput timeline")
        List<ThroughputTimelinePoint> timeline
    ) {
        @Builder
        @Schema(description = "Throughput timeline point")
        public record ThroughputTimelinePoint(
            @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24")
            String date,
            
            @Schema(description = "Requests per minute", example = "115")
            double requestsPerMinute
        ) {}
    }
    
    /**
     * Error Rate Metrics
     */
    @Builder
    @Schema(description = "Error rate metrics and timeline")
    public record ErrorRateMetrics(
        @Schema(description = "Overall error rate (%)", example = "5.5")
        double overall,
        
        @Schema(description = "Error rate by channel")
        Map<String, Double> byChannel,
        
        @Schema(description = "Error rate timeline")
        List<ErrorRateTimelinePoint> timeline
    ) {
        @Builder
        @Schema(description = "Error rate timeline point")
        public record ErrorRateTimelinePoint(
            @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24")
            String date,
            
            @Schema(description = "Error rate (%)", example = "5.2")
            double errorRate
        ) {}
    }
}


package com.singularbank.signature.routing.application.dto.response;

import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

/**
 * Metrics Analytics Response DTO
 * Story 12.4: Metrics Analytics Endpoint
 * 
 * Advanced metrics for analytics dashboard with latency, throughput, and error
 * rates
 */
@Builder
@Schema(description = "Advanced metrics analytics data")
public record MetricsAnalyticsResponse(

        @Schema(description = "Time range for metrics", example = "7d", allowableValues = {
                "1d", "7d", "30d" }) String range,

        @Schema(description = "Latency metrics with timeline") LatencyMetrics latency,

        @Schema(description = "Throughput metrics with timeline") ThroughputMetrics throughput,

        @Schema(description = "Error rate metrics with timeline") ErrorRateMetrics errorRate,

        @Schema(description = "Signature duration metrics (time from creation to completion)") SignatureDurationMetrics signatureDuration,

        @Schema(description = "Challenge completion metrics (time from sent to completed)") ChallengeCompletionMetrics challengeCompletion){

    /**
     * Latency Metrics
     */
    @Builder
    @Schema(description = "Latency percentiles and timeline")
    public record LatencyMetrics(
            @Schema(description = "Current latency percentiles") CurrentLatency current,

            @Schema(description = "Latency timeline") List<LatencyTimelinePoint> timeline) {
        @Builder
        @Schema(description = "Current latency percentiles")
        public record CurrentLatency(
                @Schema(description = "P50 latency in ms", example = "150") long p50,

                @Schema(description = "P95 latency in ms", example = "450") long p95,

                @Schema(description = "P99 latency in ms", example = "780") long p99) {
        }

        @Builder
        @Schema(description = "Latency timeline point")
        public record LatencyTimelinePoint(
                @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24") String date,

                @Schema(description = "P50 latency in ms", example = "145") long p50,

                @Schema(description = "P95 latency in ms", example = "420") long p95,

                @Schema(description = "P99 latency in ms", example = "750") long p99) {
        }
    }

    /**
     * Throughput Metrics
     */
    @Builder
    @Schema(description = "Throughput metrics and timeline")
    public record ThroughputMetrics(
            @Schema(description = "Current throughput (requests/min)", example = "120") double current,

            @Schema(description = "Throughput timeline") List<ThroughputTimelinePoint> timeline) {
        @Builder
        @Schema(description = "Throughput timeline point")
        public record ThroughputTimelinePoint(
                @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24") String date,

                @Schema(description = "Requests per minute", example = "115") double requestsPerMinute) {
        }
    }

    /**
     * Error Rate Metrics
     */
    @Builder
    @Schema(description = "Error rate metrics and timeline")
    public record ErrorRateMetrics(
            @Schema(description = "Overall error rate (%)", example = "5.5") double overall,

            @Schema(description = "Error rate by channel") Map<String, Double> byChannel,

            @Schema(description = "Error rate timeline") List<ErrorRateTimelinePoint> timeline) {
        @Builder
        @Schema(description = "Error rate timeline point")
        public record ErrorRateTimelinePoint(
                @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24") String date,

                @Schema(description = "Error rate (%)", example = "5.2") double errorRate) {
        }
    }

    /**
     * Signature Duration Metrics
     * Time from signature request creation to completion (signedAt)
     */
    @Builder
    @Schema(description = "Signature duration metrics (creation to completion)")
    public record SignatureDurationMetrics(
            @Schema(description = "Average duration in seconds", example = "12.5") double average,

            @Schema(description = "Median duration in seconds", example = "10.2") double median,

            @Schema(description = "95th percentile duration in seconds", example = "25.8") double p95,

            @Schema(description = "Duration by channel") Map<String, ChannelDuration> byChannel,

            @Schema(description = "Duration timeline") List<DurationTimelinePoint> timeline) {
        @Builder
        @Schema(description = "Duration metrics for a specific channel")
        public record ChannelDuration(
                @Schema(description = "Average duration in seconds", example = "11.5") double average,

                @Schema(description = "Median duration in seconds", example = "9.8") double median,

                @Schema(description = "95th percentile duration in seconds", example = "22.3") double p95) {
        }

        @Builder
        @Schema(description = "Duration timeline point")
        public record DurationTimelinePoint(
                @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24") String date,

                @Schema(description = "Average duration in seconds", example = "12.5") double average,

                @Schema(description = "Median duration in seconds", example = "10.2") double median) {
        }
    }

    /**
     * Challenge Completion Metrics
     * Time from challenge sent to completed, and completion rate
     */
    @Builder
    @Schema(description = "Challenge completion metrics (sent to completed)")
    public record ChallengeCompletionMetrics(
            @Schema(description = "Average response time in seconds (sent to completed)", example = "8.5") double averageResponseTime,

            @Schema(description = "Completion rate percentage", example = "92.5") double completionRate,

            @Schema(description = "Total challenges in period", example = "1250") long totalChallenges,

            @Schema(description = "Completed challenges in period", example = "1156") long completedChallenges,

            @Schema(description = "Metrics by channel") Map<String, ChannelChallengeMetrics> byChannel,

            @Schema(description = "Timeline of completion metrics") List<ChallengeTimelinePoint> timeline) {
        @Builder
        @Schema(description = "Challenge metrics for a specific channel")
        public record ChannelChallengeMetrics(
                @Schema(description = "Average response time in seconds", example = "7.5") double averageResponseTime,

                @Schema(description = "Completion rate percentage", example = "94.2") double completionRate,

                @Schema(description = "Total challenges for this channel", example = "450") long totalChallenges) {
        }

        @Builder
        @Schema(description = "Challenge completion timeline point")
        public record ChallengeTimelinePoint(
                @Schema(description = "Date (YYYY-MM-DD)", example = "2025-11-24") String date,

                @Schema(description = "Average response time in seconds", example = "8.2") double avgResponseTime,

                @Schema(description = "Completion rate percentage", example = "91.5") double completionRate) {
        }
    }
}

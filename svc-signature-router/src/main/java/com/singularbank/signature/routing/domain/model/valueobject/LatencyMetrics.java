package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Latency metrics from MuleSoft.
 * Moved from MuleSoftMetricsPort to comply with ArchUnit rule:
 * "All classes in domain.port must be interfaces"
 */
public record LatencyMetrics(
    double avgResponseTimeSeconds,
    long p50Ms,
    long p95Ms,
    long p99Ms,
    long totalRequestsMeasured
) {}


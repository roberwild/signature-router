package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Uptime/availability metrics from MuleSoft.
 * Moved from MuleSoftMetricsPort to comply with ArchUnit rule:
 * "All classes in domain.port must be interfaces"
 */
public record UptimeMetrics(
    double uptimePercent,
    int healthCheckFailures24h,
    long secondsSinceLastCheck
) {}


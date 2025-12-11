package com.singularbank.signature.routing.domain.model.valueobject;

import java.math.BigDecimal;

/**
 * Cost metrics from MuleSoft.
 * Moved from MuleSoftMetricsPort to comply with ArchUnit rule:
 * "All classes in domain.port must be interfaces"
 */
public record CostMetrics(
    BigDecimal costPerRequest,
    BigDecimal totalCostToday,
    BigDecimal totalCostMonth,
    String currency
) {}


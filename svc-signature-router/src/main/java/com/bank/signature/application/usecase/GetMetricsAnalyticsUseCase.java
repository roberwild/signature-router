package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.response.MetricsAnalyticsResponse;
import com.bank.signature.domain.model.valueobject.Channel;

/**
 * Get Metrics Analytics Use Case
 * Story 12.4: Metrics Analytics Endpoint
 * 
 * Returns advanced metrics for analytics dashboard
 */
public interface GetMetricsAnalyticsUseCase {
    
    /**
     * Get metrics analytics for specified range and optional channel filter
     * 
     * @param range   Time range (1d, 7d, 30d)
     * @param channel Optional channel filter
     * @return Metrics analytics response
     */
    MetricsAnalyticsResponse execute(String range, Channel channel);
}


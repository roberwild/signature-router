package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.response.DashboardMetricsResponse;

/**
 * Get Dashboard Metrics Use Case
 * Story 12.1: Dashboard Metrics Endpoint
 * 
 * Returns aggregated metrics for the admin dashboard including:
 * - Overview statistics
 * - Channel breakdown
 * - Latency timeline
 * - Error rate timeline
 */
public interface GetDashboardMetricsUseCase {
    
    /**
     * Get aggregated dashboard metrics
     * 
     * @return Dashboard metrics response with all aggregated data
     */
    DashboardMetricsResponse execute();
}


package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;

/**
 * Provider Health Service Interface.
 * Story 3.7: Provider Health Check Endpoint
 * 
 * Service for checking health of all signature providers.
 * 
 * Use Cases:
 * - Admin API endpoint: GET /api/v1/admin/providers/health
 * - Monitoring dashboards (Grafana, custom UIs)
 * - Troubleshooting provider connectivity issues
 * 
 * @since Story 3.7
 */
public interface ProviderHealthService {
    
    /**
     * Gets aggregated health status of all signature providers.
     * 
     * Strategy:
     * 1. Discover all SignatureProviderPort beans from Spring context
     * 2. Execute health checks (parallel for performance)
     * 3. Measure latency per provider
     * 4. Aggregate results: UP (all up), DEGRADED (some down), DOWN (all down)
     * 
     * Cache Behavior:
     * - forceRefresh=false: Uses cached health status from each provider (30s TTL)
     * - forceRefresh=true: Bypasses cache (future enhancement, currently same as false)
     * 
     * @param forceRefresh If true, bypass cache and force fresh health check
     * @return AggregatedHealthResponse with overall status and per-provider details
     */
    AggregatedHealthResponse getProvidersHealth(boolean forceRefresh);
}


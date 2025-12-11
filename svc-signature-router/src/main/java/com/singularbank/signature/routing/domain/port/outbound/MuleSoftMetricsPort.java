package com.singularbank.signature.routing.domain.port.outbound;

import java.util.Optional;

import com.singularbank.signature.routing.domain.model.valueobject.LatencyMetrics;
import com.singularbank.signature.routing.domain.model.valueobject.UptimeMetrics;
import com.singularbank.signature.routing.domain.model.valueobject.CostMetrics;

/**
 * Domain port interface for MuleSoft metrics retrieval.
 * Epic 14: Frontend-Backend Integration - Provider Metrics
 * 
 * This port abstracts the communication with MuleSoft API Gateway to retrieve
 * provider-specific metrics including latency, uptime, and cost information.
 * 
 * <p><b>Hexagonal Architecture:</b> This interface is defined in the domain layer
 * and will have two implementations:
 * <ul>
 *   <li>MuleSoftMetricsMockAdapter - Returns mock data (current implementation)</li>
 *   <li>MuleSoftMetricsAdapter - Real MuleSoft integration (future implementation)</li>
 * </ul>
 * 
 * <p><b>MuleSoft Integration Status:</b>
 * As per the meeting with MuleSoft team, we are awaiting:
 * - Provider metadata in responses (actualProvider, latency, cost)
 * - Health check endpoint with per-provider status
 * - Metrics endpoint with latency percentiles
 * 
 * @since Epic 14
 * @see docs/HALLAZGOS-COMMUNICATION-SERVICES-API.md
 * @see docs/PREGUNTAS-MULESOFT-REUNION-LUNES.md
 */
public interface MuleSoftMetricsPort {
    
    /**
     * Retrieves latency metrics for a specific provider from MuleSoft.
     * 
     * @param providerCode Internal provider code (e.g., "TWILIO_SMS", "FIREBASE_PUSH")
     * @return Latency metrics or empty if provider not found
     */
    Optional<LatencyMetrics> getLatencyMetrics(String providerCode);
    
    /**
     * Retrieves uptime/availability metrics for a specific provider.
     * 
     * @param providerCode Internal provider code
     * @return Uptime metrics or empty if provider not found
     */
    Optional<UptimeMetrics> getUptimeMetrics(String providerCode);
    
    /**
     * Retrieves cost metrics for a specific provider.
     * 
     * @param providerCode Internal provider code
     * @return Cost metrics or empty if provider not found or cost tracking disabled
     */
    Optional<CostMetrics> getCostMetrics(String providerCode);
    
    /**
     * Checks if MuleSoft integration is active and providing real metrics.
     * 
     * @return true if connected to real MuleSoft, false if using mock data
     */
    boolean isIntegrated();
    
    /**
     * Gets the MuleSoft provider identifier for our internal provider code.
     * 
     * @param providerCode Internal provider code
     * @return MuleSoft provider ID (e.g., "TWILIO_US") or null if not mapped
     */
    String getMuleSoftProviderId(String providerCode);
}


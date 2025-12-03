package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.ProviderMetricsResponse;
import com.bank.signature.domain.model.ProviderConfig;

import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for provider metrics retrieval.
 * Epic 14: Frontend-Backend Integration - Provider Metrics
 * 
 * Combines internal metrics (from signature_requests table) with
 * external metrics (from MuleSoft API Gateway) to provide a complete
 * picture of provider performance.
 * 
 * @since Epic 14
 */
public interface ProviderMetricsService {
    
    /**
     * Get comprehensive metrics for a specific provider.
     * 
     * @param providerId Provider UUID
     * @return Provider metrics or empty if provider not found
     */
    Optional<ProviderMetricsResponse> getMetrics(UUID providerId);
    
    /**
     * Get metrics for a provider by its configuration.
     * 
     * @param providerConfig Provider configuration
     * @return Provider metrics
     */
    ProviderMetricsResponse getMetrics(ProviderConfig providerConfig);
}


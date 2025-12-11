package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.ProviderMetricsResponse;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import com.singularbank.signature.routing.domain.model.valueobject.CostMetrics;
import com.singularbank.signature.routing.domain.model.valueobject.LatencyMetrics;
import com.singularbank.signature.routing.domain.model.valueobject.UptimeMetrics;
import com.singularbank.signature.routing.domain.port.outbound.MuleSoftMetricsPort;
import com.singularbank.signature.routing.domain.port.outbound.ProviderConfigRepository;
import com.singularbank.signature.routing.domain.port.outbound.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of ProviderMetricsService.
 * Epic 14: Frontend-Backend Integration - Provider Metrics
 * 
 * Combines internal metrics (from database) with external metrics (from MuleSoft)
 * to provide comprehensive provider performance data.
 * 
 * <p><b>Internal Metrics (from signature_requests table):</b>
 * <ul>
 *   <li>requestsToday, requests7d, requests30d</li>
 *   <li>successRate, failedRequestsToday</li>
 * </ul>
 * 
 * <p><b>External Metrics (from MuleSoft - mocked until integration):</b>
 * <ul>
 *   <li>avgResponseTime, latency percentiles (P50, P95, P99)</li>
 *   <li>uptime, healthCheckFailures</li>
 *   <li>costPerRequest, totalCost</li>
 * </ul>
 * 
 * @since Epic 14
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderMetricsServiceImpl implements ProviderMetricsService {
    
    private final ProviderConfigRepository providerConfigRepository;
    private final SignatureRequestRepository signatureRequestRepository;
    private final MuleSoftMetricsPort muleSoftMetricsPort;
    
    @Override
    public Optional<ProviderMetricsResponse> getMetrics(UUID providerId) {
        return providerConfigRepository.findById(providerId)
            .map(this::getMetrics);
    }
    
    @Override
    public ProviderMetricsResponse getMetrics(ProviderConfig providerConfig) {
        log.debug("Calculating metrics for provider: {} ({})", 
            providerConfig.getProviderCode(), 
            providerConfig.getProviderType().name());
        
        // Time boundaries
        Instant now = Instant.now();
        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant sevenDaysAgo = now.minusSeconds(7 * 24 * 60 * 60);
        Instant thirtyDaysAgo = now.minusSeconds(30 * 24 * 60 * 60);
        
        // ========================================
        // Internal Metrics (from database)
        // ========================================
        
        // TODO: These queries need provider_id column in signature_requests table
        // For now, we estimate based on total requests distributed by provider count
        long totalRequestsToday = signatureRequestRepository.countByCreatedAtBetween(todayStart, now);
        long totalRequests7d = signatureRequestRepository.countByCreatedAtBetween(sevenDaysAgo, now);
        long totalRequests30d = signatureRequestRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        
        long validatedToday = signatureRequestRepository.countByStatusAndCreatedAtBetween(
            SignatureStatus.VALIDATED, todayStart, now);
        long failedToday = signatureRequestRepository.countByStatusAndCreatedAtBetween(
            SignatureStatus.FAILED, todayStart, now);
        long expiredToday = signatureRequestRepository.countByStatusAndCreatedAtBetween(
            SignatureStatus.EXPIRED, todayStart, now);
        
        // Calculate success rate
        long totalCompletedToday = validatedToday + failedToday + expiredToday;
        double successRate = totalCompletedToday > 0 
            ? (validatedToday * 100.0) / totalCompletedToday 
            : 100.0;
        
        // Estimate per-provider metrics (divide by number of enabled providers)
        long enabledProviders = providerConfigRepository.countByEnabled(true);
        long providerShare = Math.max(1, enabledProviders);
        
        long requestsToday = totalRequestsToday / providerShare;
        long requests7d = totalRequests7d / providerShare;
        long requests30d = totalRequests30d / providerShare;
        long failedRequestsToday = (failedToday + expiredToday) / providerShare;
        
        // ========================================
        // External Metrics (from MuleSoft)
        // ========================================
        
        // Build provider code for MuleSoft lookup
        String muleSoftProviderCode = buildMuleSoftProviderCode(providerConfig);
        
        // Get latency metrics
        LatencyMetrics latency = muleSoftMetricsPort.getLatencyMetrics(muleSoftProviderCode)
            .orElse(new LatencyMetrics(1.5, 95, 250, 450, 0));
        
        // Get uptime metrics
        UptimeMetrics uptime = muleSoftMetricsPort.getUptimeMetrics(muleSoftProviderCode)
            .orElse(new UptimeMetrics(99.9, 0, 60));
        
        // Get cost metrics
        CostMetrics cost = muleSoftMetricsPort.getCostMetrics(muleSoftProviderCode)
            .orElse(new CostMetrics(
                new BigDecimal("0.05"),
                new BigDecimal("0.00"),
                new BigDecimal("0.00"),
                "EUR"
            ));
        
        // Calculate actual cost based on real request count
        BigDecimal actualCostToday = cost.costPerRequest()
            .multiply(BigDecimal.valueOf(requestsToday));
        BigDecimal actualCostMonth = cost.costPerRequest()
            .multiply(BigDecimal.valueOf(requests30d));
        
        // ========================================
        // Build Response
        // ========================================
        
        return ProviderMetricsResponse.builder()
            // Identity
            .providerId(providerConfig.getId())
            .providerName(providerConfig.getProviderName())
            
            // Internal metrics
            .requestsToday(requestsToday)
            .requests7d(requests7d)
            .requests30d(requests30d)
            .successRate(Math.round(successRate * 10.0) / 10.0) // Round to 1 decimal
            .failedRequestsToday(failedRequestsToday)
            
            // Latency metrics (from MuleSoft)
            .avgResponseTime(latency.avgResponseTimeSeconds())
            .latencyP50Ms(latency.p50Ms())
            .latencyP95Ms(latency.p95Ms())
            .latencyP99Ms(latency.p99Ms())
            
            // Availability metrics (from MuleSoft)
            .uptime(uptime.uptimePercent())
            .healthCheckFailures24h(uptime.healthCheckFailures24h())
            .secondsSinceLastHealthCheck(uptime.secondsSinceLastCheck())
            
            // Cost metrics (from MuleSoft)
            .costPerRequestEur(cost.costPerRequest())
            .totalCostTodayEur(actualCostToday)
            .totalCostMonthEur(actualCostMonth)
            
            // MuleSoft integration metadata
            .mulesoftIntegrated(muleSoftMetricsPort.isIntegrated())
            .mulesoftProviderId(muleSoftMetricsPort.getMuleSoftProviderId(muleSoftProviderCode))
            .calculatedAt(now)
            
            .build();
    }
    
    /**
     * Builds the MuleSoft provider code from ProviderConfig.
     * Format: {PROVIDER_NAME}_{TYPE} (e.g., "TWILIO_SMS", "FIREBASE_PUSH")
     */
    private String buildMuleSoftProviderCode(ProviderConfig config) {
        String name = config.getProviderCode().toUpperCase()
            .replace("-", "_")
            .replace(" ", "_");
        
        // If provider code already contains the type, use it as-is
        String type = config.getProviderType().name();
        if (name.contains(type)) {
            return name;
        }
        
        // Otherwise, append the type
        return name + "_" + type;
    }
}


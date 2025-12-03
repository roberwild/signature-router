package com.bank.signature.infrastructure.adapter.outbound.mulesoft;

import com.bank.signature.domain.port.outbound.MuleSoftMetricsPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

/**
 * Mock implementation of MuleSoftMetricsPort for development and testing.
 * Epic 14: Frontend-Backend Integration - Provider Metrics
 * 
 * This adapter provides realistic mock data until MuleSoft integration is complete.
 * 
 * <p><b>Activation:</b> This adapter is active when:
 * <ul>
 *   <li>mulesoft.metrics.enabled=false (default)</li>
 *   <li>Or mulesoft.metrics.enabled property is not set</li>
 * </ul>
 * 
 * <p><b>Mock Data Strategy:</b>
 * - Latency: Realistic values based on provider type (SMS ~1.2s, PUSH ~0.8s)
 * - Uptime: High availability (98-99.9%)
 * - Cost: Based on typical provider pricing (SMS ~0.05€, PUSH ~0.01€)
 * 
 * <p><b>IMPORTANT:</b> Before deploying to production, ensure:
 * <ol>
 *   <li>MuleSoft credentials are configured</li>
 *   <li>mulesoft.metrics.enabled=true is set</li>
 *   <li>MuleSoftMetricsAdapter is implemented with real API calls</li>
 * </ol>
 * 
 * @since Epic 14
 * @see MuleSoftMetricsPort
 */
@Component
@ConditionalOnProperty(name = "mulesoft.metrics.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class MuleSoftMetricsMockAdapter implements MuleSoftMetricsPort {
    
    private static final Random random = new Random();
    
    // Mock provider mappings (internal code -> MuleSoft provider ID)
    private static final Map<String, String> PROVIDER_MAPPINGS = Map.of(
        "TWILIO_SMS", "TWILIO_US",
        "FIREBASE_PUSH", "FIREBASE_FCM",
        "ONESIGNAL_PUSH", "ONESIGNAL_EU",
        "VONAGE_VOICE", "VONAGE_EU",
        "AWS_SNS", "AWS_SNS_EU"
    );
    
    // Base latency by provider type (seconds)
    private static final Map<String, Double> BASE_LATENCY = Map.of(
        "SMS", 1.2,
        "PUSH", 0.8,
        "VOICE", 2.5,
        "BIOMETRIC", 1.8
    );
    
    // Cost per request by provider type (EUR)
    private static final Map<String, BigDecimal> COST_PER_REQUEST = Map.of(
        "SMS", new BigDecimal("0.05"),
        "PUSH", new BigDecimal("0.01"),
        "VOICE", new BigDecimal("0.15"),
        "BIOMETRIC", new BigDecimal("0.08")
    );
    
    public MuleSoftMetricsMockAdapter() {
        log.warn("⚠️ USING MOCK MULESOFT METRICS ADAPTER - Not for production use!");
        log.warn("⚠️ Set mulesoft.metrics.enabled=true and configure real adapter for production");
    }
    
    @Override
    public Optional<LatencyMetrics> getLatencyMetrics(String providerCode) {
        String providerType = extractProviderType(providerCode);
        double baseLatency = BASE_LATENCY.getOrDefault(providerType, 1.5);
        
        // Add some variance to make it realistic
        double variance = 0.2 + (random.nextDouble() * 0.3); // 20-50% variance
        double avgLatency = baseLatency * (1 + (random.nextDouble() - 0.5) * variance);
        
        // Calculate percentiles based on average
        long p50Ms = (long) (avgLatency * 1000 * 0.8);  // P50 is ~80% of avg
        long p95Ms = (long) (avgLatency * 1000 * 1.5);  // P95 is ~150% of avg
        long p99Ms = (long) (avgLatency * 1000 * 2.2);  // P99 is ~220% of avg
        
        return Optional.of(new LatencyMetrics(
            Math.round(avgLatency * 100.0) / 100.0, // Round to 2 decimals
            p50Ms,
            p95Ms,
            p99Ms,
            1000 + random.nextInt(9000) // 1000-10000 requests measured
        ));
    }
    
    @Override
    public Optional<UptimeMetrics> getUptimeMetrics(String providerCode) {
        // Most providers have high uptime (98-99.9%)
        double baseUptime = 99.0 + (random.nextDouble() * 0.9);
        
        // Occasionally simulate some failures
        int failures = random.nextInt(100) < 5 ? random.nextInt(3) : 0;
        
        // Last health check was recent (5-120 seconds ago)
        long secondsSinceCheck = 5 + random.nextInt(115);
        
        return Optional.of(new UptimeMetrics(
            Math.round(baseUptime * 10.0) / 10.0, // Round to 1 decimal
            failures,
            secondsSinceCheck
        ));
    }
    
    @Override
    public Optional<CostMetrics> getCostMetrics(String providerCode) {
        String providerType = extractProviderType(providerCode);
        BigDecimal costPerRequest = COST_PER_REQUEST.getOrDefault(providerType, new BigDecimal("0.05"));
        
        // Simulate daily volume (500-10000 requests)
        int dailyRequests = 500 + random.nextInt(9500);
        BigDecimal totalToday = costPerRequest.multiply(BigDecimal.valueOf(dailyRequests))
            .setScale(2, RoundingMode.HALF_UP);
        
        // Monthly cost (approximately 30x daily with some variance)
        BigDecimal totalMonth = totalToday.multiply(BigDecimal.valueOf(25 + random.nextInt(10)))
            .setScale(2, RoundingMode.HALF_UP);
        
        return Optional.of(new CostMetrics(
            costPerRequest,
            totalToday,
            totalMonth,
            "EUR"
        ));
    }
    
    @Override
    public boolean isIntegrated() {
        return false; // This is a mock adapter
    }
    
    @Override
    public String getMuleSoftProviderId(String providerCode) {
        return PROVIDER_MAPPINGS.get(providerCode);
    }
    
    /**
     * Extracts provider type from provider code.
     * E.g., "TWILIO_SMS" -> "SMS", "FIREBASE_PUSH" -> "PUSH"
     */
    private String extractProviderType(String providerCode) {
        if (providerCode == null) return "SMS";
        
        if (providerCode.contains("SMS") || providerCode.contains("SNS")) {
            return "SMS";
        } else if (providerCode.contains("PUSH") || providerCode.contains("FCM") || providerCode.contains("ONESIGNAL")) {
            return "PUSH";
        } else if (providerCode.contains("VOICE") || providerCode.contains("VONAGE")) {
            return "VOICE";
        } else if (providerCode.contains("BIO")) {
            return "BIOMETRIC";
        }
        return "SMS"; // Default
    }
}


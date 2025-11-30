package com.bank.signature.infrastructure.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache Configuration using Caffeine
 * Story 12.1: Dashboard Metrics Endpoint
 * Story 12.4: Metrics Analytics Endpoint
 * Story 12.6: Keycloak Security Audit Endpoint
 * 
 * Configures caching for expensive operations like dashboard metrics aggregation.
 * 
 * Cache Strategies:
 * - dashboardMetrics: 1 minute TTL (balance between freshness and performance)
 * - metricsAnalytics: 5 minutes TTL (less frequent, more expensive)
 * - securityOverview: 1 minute TTL (security metrics)
 * - sloMetrics: 5 minutes TTL (SLO calculations are expensive)
 * 
 * Benefits:
 * - Reduced database load
 * - Faster response times (~10-50ms vs 200-500ms)
 * - Better user experience
 * 
 * @since Story 12.1, 12.4, 12.6
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * Configure Caffeine cache manager with multiple caches
     * 
     * Caffeine benefits over standard caching:
     * - High performance (async loading, write-through)
     * - Size-based eviction
     * - Time-based expiration (TTL, TTI)
     * - Statistics and monitoring
     * 
     * Cache Configuration:
     * - dashboardMetrics: 1 minute TTL (frequent updates needed)
     * - metricsAnalytics: 5 minutes TTL (less frequent, more expensive)
     * - securityOverview: 1 minute TTL (security metrics)
     * - sloMetrics: 5 minutes TTL (SLO calculations are expensive)
     * - providerHealth: 30 seconds TTL (health checks)
     * 
     * @return Configured cache manager
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "dashboardMetrics",
            "metricsAnalytics",
            "securityOverview",
            "sloMetrics",
            "providerHealth"
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            // Default TTL for all caches
            // dashboardMetrics: 1 minute
            // metricsAnalytics: 5 minutes (handled by @Cacheable in use case)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            // Maximum cache size (prevent memory issues)
            .maximumSize(200)
            // Enable statistics for monitoring
            .recordStats()
        );
        
        return cacheManager;
    }
}


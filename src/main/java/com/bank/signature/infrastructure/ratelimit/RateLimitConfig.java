package com.bank.signature.infrastructure.ratelimit;

import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuration for rate limiting using Resilience4j.
 * Critical Improvement #2: Rate Limiting
 * 
 * <p>Configures two types of rate limiters:
 * <ul>
 * <li><strong>Global:</strong> 100 requests/second (FR86)</li>
 * <li><strong>Per-customer:</strong> 10 requests/minute (FR85) - created dynamically</li>
 * </ul>
 * 
 * @since Critical Improvements - Rate Limiting
 */
@Configuration
public class RateLimitConfig {
    
    /**
     * Global rate limiter registry.
     * Provides centralized management of all rate limiters.
     */
    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        // Default config for global rate limiter
        RateLimiterConfig globalConfig = RateLimiterConfig.custom()
            .limitForPeriod(100)              // 100 requests
            .limitRefreshPeriod(Duration.ofSeconds(1))  // per second
            .timeoutDuration(Duration.ZERO)   // fail immediately
            .build();
        
        RateLimiterRegistry registry = RateLimiterRegistry.of(globalConfig);
        
        // Pre-create global rate limiter
        registry.rateLimiter("signatureCreation", globalConfig);
        registry.rateLimiter("signatureCompletion", globalConfig);
        registry.rateLimiter("ruleManagement", RateLimiterConfig.custom()
            .limitForPeriod(10)
            .limitRefreshPeriod(Duration.ofSeconds(1))
            .timeoutDuration(Duration.ZERO)
            .build()
        );
        
        return registry;
    }
}


package com.singularbank.signature.routing.infrastructure.ratelimit;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service for customer-specific rate limiting.
 * Critical Improvement #2: Rate Limiting
 * 
 * <p>Implements per-customer rate limiting to prevent abuse:
 * <ul>
 * <li>10 requests per minute per customer (FR85)</li>
 * <li>Dynamic rate limiter creation per customerId</li>
 * <li>Metrics tracking per customer</li>
 * </ul>
 * 
 * <p><strong>Usage:</strong>
 * <pre>
 * customerRateLimitService.checkRateLimit(customerId);
 * </pre>
 * 
 * @since Critical Improvements - Rate Limiting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerRateLimitService {
    
    private final RateLimiterRegistry rateLimiterRegistry;
    private final MeterRegistry meterRegistry;
    
    private static final String RATE_LIMITER_PREFIX = "customer-";
    private static final int LIMIT_FOR_PERIOD = 10; // 10 requests
    private static final Duration LIMIT_REFRESH_PERIOD = Duration.ofMinutes(1); // per minute
    private static final Duration TIMEOUT = Duration.ZERO; // fail immediately
    
    /**
     * Checks if the customer has exceeded their rate limit.
     * 
     * @param customerId the pseudonymized customer ID
     * @throws RateLimitExceededException if rate limit is exceeded
     */
    public void checkRateLimit(String customerId) {
        RateLimiter rateLimiter = getOrCreateRateLimiter(customerId);
        
        boolean permitted = rateLimiter.acquirePermission();
        
        if (!permitted) {
            log.warn("Rate limit exceeded for customer: {}", customerId);
            meterRegistry.counter("signature.ratelimit.customer.exceeded",
                "customer_id", customerId
            ).increment();
            
            throw new RateLimitExceededException("customer", customerId);
        }
        
        log.debug("Rate limit check passed for customer: {}", customerId);
        meterRegistry.counter("signature.ratelimit.customer.allowed",
            "customer_id", customerId
        ).increment();
    }
    
    /**
     * Gets or creates a rate limiter for the specified customer.
     * 
     * @param customerId the pseudonymized customer ID
     * @return the rate limiter instance
     */
    private RateLimiter getOrCreateRateLimiter(String customerId) {
        String rateLimiterName = RATE_LIMITER_PREFIX + customerId;
        
        return rateLimiterRegistry.rateLimiter(rateLimiterName, () -> 
            RateLimiterConfig.custom()
                .limitForPeriod(LIMIT_FOR_PERIOD)
                .limitRefreshPeriod(LIMIT_REFRESH_PERIOD)
                .timeoutDuration(TIMEOUT)
                .build()
        );
    }
    
    /**
     * Gets current metrics for a customer's rate limiter.
     * Useful for monitoring and debugging.
     * 
     * @param customerId the pseudonymized customer ID
     * @return metrics or null if rate limiter doesn't exist
     */
    public RateLimiterMetrics getMetrics(String customerId) {
        String rateLimiterName = RATE_LIMITER_PREFIX + customerId;
        
        return rateLimiterRegistry.find(rateLimiterName)
            .map(rateLimiter -> {
                var metrics = rateLimiter.getMetrics();
                return new RateLimiterMetrics(
                    customerId,
                    metrics.getAvailablePermissions(),
                    metrics.getNumberOfWaitingThreads()
                );
            })
            .orElse(null);
    }
    
    /**
     * Metrics DTO for rate limiter state.
     */
    public record RateLimiterMetrics(
        String customerId,
        int availablePermissions,
        int waitingThreads
    ) {}
}


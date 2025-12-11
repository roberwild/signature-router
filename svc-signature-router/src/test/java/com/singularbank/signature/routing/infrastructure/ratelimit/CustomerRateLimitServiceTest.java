package com.singularbank.signature.routing.infrastructure.ratelimit;

import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for CustomerRateLimitService.
 * Critical Improvement #2: Rate Limiting
 */
@DisplayName("CustomerRateLimitService")
class CustomerRateLimitServiceTest {
    
    private CustomerRateLimitService service;
    private RateLimiterRegistry rateLimiterRegistry;
    private MeterRegistry meterRegistry;
    
    @BeforeEach
    void setUp() {
        rateLimiterRegistry = RateLimiterRegistry.ofDefaults();
        meterRegistry = new SimpleMeterRegistry();
        service = new CustomerRateLimitService(rateLimiterRegistry, meterRegistry);
    }
    
    @Test
    @DisplayName("Should allow requests within rate limit (10/min)")
    void shouldAllowRequestsWithinRateLimit() {
        String customerId = "customer-12345";
        
        // Should allow 10 requests in 1 minute
        for (int i = 0; i < 10; i++) {
            service.checkRateLimit(customerId);
        }
        
        // Verify metrics
        assertThat(meterRegistry.counter("signature.ratelimit.customer.allowed",
            "customer_id", customerId).count()).isEqualTo(10.0);
    }
    
    @Test
    @DisplayName("Should throw RateLimitExceededException on 11th request")
    void shouldThrowExceptionWhenRateLimitExceeded() {
        String customerId = "customer-67890";
        
        // Consume all 10 permits
        for (int i = 0; i < 10; i++) {
            service.checkRateLimit(customerId);
        }
        
        // 11th request should fail
        assertThatThrownBy(() -> service.checkRateLimit(customerId))
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessageContaining("customer")
            .hasMessageContaining(customerId);
        
        // Verify exceeded metric
        assertThat(meterRegistry.counter("signature.ratelimit.customer.exceeded",
            "customer_id", customerId).count()).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should create separate rate limiters per customer")
    void shouldCreateSeparateRateLimitersPerCustomer() {
        String customer1 = "customer-111";
        String customer2 = "customer-222";
        
        // Customer 1: consume all permits
        for (int i = 0; i < 10; i++) {
            service.checkRateLimit(customer1);
        }
        
        // Customer 2: should still have permits
        service.checkRateLimit(customer2);
        
        // Customer 1: no permits left
        assertThatThrownBy(() -> service.checkRateLimit(customer1))
            .isInstanceOf(RateLimitExceededException.class);
        
        // Customer 2: still has permits
        for (int i = 1; i < 10; i++) {
            service.checkRateLimit(customer2);
        }
    }
    
    @Test
    @DisplayName("Should return metrics for customer")
    void shouldReturnMetricsForCustomer() {
        String customerId = "customer-metrics";
        
        // Consume 3 permits
        for (int i = 0; i < 3; i++) {
            service.checkRateLimit(customerId);
        }
        
        CustomerRateLimitService.RateLimiterMetrics metrics = service.getMetrics(customerId);
        
        assertThat(metrics).isNotNull();
        assertThat(metrics.customerId()).isEqualTo(customerId);
        assertThat(metrics.availablePermissions()).isEqualTo(7); // 10 - 3 = 7
        assertThat(metrics.waitingThreads()).isEqualTo(0);
    }
    
    @Test
    @DisplayName("Should return null metrics for non-existent customer")
    void shouldReturnNullMetricsForNonExistentCustomer() {
        CustomerRateLimitService.RateLimiterMetrics metrics = service.getMetrics("nonexistent");
        
        assertThat(metrics).isNull();
    }
}


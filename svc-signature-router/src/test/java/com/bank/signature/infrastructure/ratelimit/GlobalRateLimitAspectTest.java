package com.bank.signature.infrastructure.ratelimit;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GlobalRateLimitAspect.
 * Critical Improvement #2: Rate Limiting
 */
@DisplayName("GlobalRateLimitAspect")
class GlobalRateLimitAspectTest {
    
    private GlobalRateLimitAspect aspect;
    private RateLimiterRegistry rateLimiterRegistry;
    private MeterRegistry meterRegistry;
    
    @Mock
    private ProceedingJoinPoint joinPoint;
    
    @Mock
    private RateLimited rateLimitedAnnotation;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        RateLimiterConfig config = RateLimiterConfig.custom()
            .limitForPeriod(3) // Only 3 for testing
            .limitRefreshPeriod(Duration.ofSeconds(1))
            .timeoutDuration(Duration.ZERO)
            .build();
        
        rateLimiterRegistry = RateLimiterRegistry.of(config);
        rateLimiterRegistry.rateLimiter("testLimiter", config);
        
        meterRegistry = new SimpleMeterRegistry();
        aspect = new GlobalRateLimitAspect(rateLimiterRegistry, meterRegistry);
    }
    
    @Test
    @DisplayName("Should allow requests within global rate limit")
    void shouldAllowRequestsWithinGlobalRateLimit() throws Throwable {
        when(rateLimitedAnnotation.name()).thenReturn("testLimiter");
        when(joinPoint.proceed()).thenReturn("success");
        
        // Should allow 3 requests
        for (int i = 0; i < 3; i++) {
            Object result = aspect.applyRateLimit(joinPoint, rateLimitedAnnotation);
            assertThat(result).isEqualTo("success");
        }
        
        // Verify metrics
        assertThat(meterRegistry.counter("signature.ratelimit.global.allowed",
            "limiter", "testLimiter").count()).isEqualTo(3.0);
    }
    
    @Test
    @DisplayName("Should throw RateLimitExceededException when global limit exceeded")
    void shouldThrowExceptionWhenGlobalLimitExceeded() throws Throwable {
        when(rateLimitedAnnotation.name()).thenReturn("testLimiter");
        when(joinPoint.proceed()).thenReturn("success");
        
        // Consume all 3 permits
        for (int i = 0; i < 3; i++) {
            aspect.applyRateLimit(joinPoint, rateLimitedAnnotation);
        }
        
        // 4th request should fail
        assertThatThrownBy(() -> aspect.applyRateLimit(joinPoint, rateLimitedAnnotation))
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessageContaining("global")
            .hasMessageContaining("testLimiter");
        
        // Verify exceeded metric
        assertThat(meterRegistry.counter("signature.ratelimit.global.exceeded",
            "limiter", "testLimiter").count()).isEqualTo(1.0);
    }
}


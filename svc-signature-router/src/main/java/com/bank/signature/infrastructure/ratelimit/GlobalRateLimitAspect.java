package com.bank.signature.infrastructure.ratelimit;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * Aspect for global rate limiting using Resilience4j.
 * Critical Improvement #2: Rate Limiting
 * 
 * <p>Intercepts methods annotated with @RateLimited and applies
 * global rate limiting (100 requests/second for signature creation).
 * 
 * @since Critical Improvements - Rate Limiting
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class GlobalRateLimitAspect {
    
    private final RateLimiterRegistry rateLimiterRegistry;
    private final MeterRegistry meterRegistry;
    
    @Around("@annotation(rateLimited)")
    public Object applyRateLimit(ProceedingJoinPoint joinPoint, RateLimited rateLimited) throws Throwable {
        String rateLimiterName = rateLimited.name();
        RateLimiter rateLimiter = rateLimiterRegistry.rateLimiter(rateLimiterName);
        
        boolean permitted = rateLimiter.acquirePermission();
        
        if (!permitted) {
            log.warn("Global rate limit exceeded for: {}", rateLimiterName);
            meterRegistry.counter("signature.ratelimit.global.exceeded",
                "limiter", rateLimiterName
            ).increment();
            
            throw new RateLimitExceededException("global", rateLimiterName);
        }
        
        meterRegistry.counter("signature.ratelimit.global.allowed",
            "limiter", rateLimiterName
        ).increment();
        
        return joinPoint.proceed();
    }
}


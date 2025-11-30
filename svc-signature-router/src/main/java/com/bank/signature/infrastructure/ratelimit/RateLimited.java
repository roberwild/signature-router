package com.bank.signature.infrastructure.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply global rate limiting to a method.
 * Critical Improvement #2: Rate Limiting
 * 
 * <p>Usage:
 * <pre>
 * &#64;RateLimited(name = "signatureCreation")
 * public SignatureRequest execute(CreateSignatureRequestDto request) {
 *     // ...
 * }
 * </pre>
 * 
 * @since Critical Improvements - Rate Limiting
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {
    
    /**
     * Name of the rate limiter to use (must be configured in RateLimiterRegistry).
     */
    String name();
}


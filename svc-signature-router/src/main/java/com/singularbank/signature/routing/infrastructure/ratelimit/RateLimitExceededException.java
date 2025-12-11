package com.singularbank.signature.routing.infrastructure.ratelimit;

/**
 * Exception thrown when a rate limit is exceeded.
 * Critical Improvement #2: Rate Limiting
 * 
 * <p>This exception is thrown when:
 * <ul>
 * <li>Global rate limit is exceeded (100 requests/second)</li>
 * <li>Customer-specific rate limit is exceeded (10 requests/minute)</li>
 * </ul>
 * 
 * @since Critical Improvements - Rate Limiting
 */
public class RateLimitExceededException extends RuntimeException {
    
    private final String rateLimiterName;
    private final String identifier;
    
    public RateLimitExceededException(String rateLimiterName, String identifier) {
        super(String.format("Rate limit exceeded for %s: %s", rateLimiterName, identifier));
        this.rateLimiterName = rateLimiterName;
        this.identifier = identifier;
    }
    
    public String getRateLimiterName() {
        return rateLimiterName;
    }
    
    public String getIdentifier() {
        return identifier;
    }
}


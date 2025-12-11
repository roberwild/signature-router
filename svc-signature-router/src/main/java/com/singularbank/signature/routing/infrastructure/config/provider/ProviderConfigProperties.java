package com.singularbank.signature.routing.infrastructure.config.provider;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Base configuration properties for all signature providers.
 * Story 3.6: Provider Configuration Management
 * 
 * Provides common configuration properties shared across all provider implementations
 * (SMS, Push, Voice, Biometric). Each provider-specific config class should extend
 * this abstract class to inherit common properties and add provider-specific ones.
 * 
 * Common Properties:
 * - **enabled**: Feature flag to enable/disable provider
 * - **timeoutSeconds**: Max time to wait for provider response
 * - **retryMaxAttempts**: Number of retry attempts on transient failures
 * 
 * Validation:
 * - Bean Validation (JSR 380) annotations ensure configuration validity at startup
 * - Application fails to start if configuration is invalid (fail-fast)
 * 
 * Usage Pattern:
 * <pre>
 * @Configuration
 * @ConfigurationProperties(prefix = "providers.twilio-sms")
 * @Validated
 * public class TwilioSmsConfig extends ProviderConfigProperties {
 *     // Provider-specific properties
 *     private String accountSid;
 *     private String authToken;
 *     // ...
 * }
 * </pre>
 * 
 * YAML Configuration Example:
 * <pre>
 * providers:
 *   twilio-sms:
 *     enabled: true
 *     timeout-seconds: 5
 *     retry-max-attempts: 3
 *     account-sid: ${TWILIO_ACCOUNT_SID}
 *     auth-token: ${TWILIO_AUTH_TOKEN}
 * </pre>
 * 
 * Security:
 * - Credentials (API keys, tokens) should reference environment variables or Vault
 * - NEVER hardcode sensitive data in YAML files
 * - Secrets masked in /actuator/configprops endpoint
 * 
 * Provider Bean Creation:
 * - Use @ConditionalOnProperty(prefix = "providers.{type}", name = "enabled", havingValue = "true")
 * - Bean only created if enabled=true (avoids unnecessary initialization)
 * 
 * @since Story 3.6
 * @see org.springframework.boot.context.properties.ConfigurationProperties
 * @see org.springframework.validation.annotation.Validated
 */
@Data
public abstract class ProviderConfigProperties {
    
    /**
     * Feature flag - provider enabled/disabled.
     * 
     * Default: false (providers disabled by default for safety)
     * 
     * When false:
     * - Provider bean NOT created (@ConditionalOnProperty)
     * - Health check skips this provider
     * - No API calls made to external service
     * 
     * Use Cases:
     * - Disable provider during maintenance
     * - Gradual rollout (enable in staging first)
     * - Cost control (disable expensive providers)
     */
    @NotNull(message = "enabled flag cannot be null")
    private boolean enabled = false;
    
    /**
     * Timeout for provider operations (seconds).
     * 
     * Default: 3 seconds
     * Min: 1 second (very fast operations only)
     * Max: 30 seconds (avoid long-hanging requests)
     * 
     * Applied to:
     * - sendChallenge() method (SMS send, push notification, etc.)
     * - checkHealth() method (provider availability check)
     * 
     * Timeout Strategy:
     * - Twilio SMS: 5 seconds (API typically responds in 1-2s)
     * - FCM Push: 3 seconds (fast, but network-dependent)
     * - Voice Call: 10 seconds (call initiation takes longer)
     * - Biometric: 3 seconds (stub, instant response)
     * 
     * Best Practice:
     * - Set timeout based on provider SLA + buffer
     * - Lower timeout = faster failure detection = better UX
     * - Too low timeout = false positives (legitimate slow responses)
     */
    @Min(value = 1, message = "timeout must be at least 1 second")
    @Max(value = 30, message = "timeout must not exceed 30 seconds")
    private int timeoutSeconds = 3;
    
    /**
     * Maximum number of retry attempts on transient failures.
     * 
     * Default: 3 attempts
     * Min: 0 (no retries - fail immediately)
     * Max: 5 (excessive retries increase latency)
     * 
     * Retry Strategy (Resilience4j):
     * - Retries only on transient errors (network timeouts, 5xx responses)
     * - NO retry on permanent errors (4xx, invalid credentials)
     * - Exponential backoff between retries
     * 
     * Retry Count by Provider:
     * - SMS: 3 retries (network issues common)
     * - Push: 2 retries (FCM reliable, but network flaky)
     * - Voice: 2 retries (call initiation retry acceptable)
     * - Biometric: 0 retries (stub, always succeeds)
     * 
     * Latency Impact:
     * - Each retry adds: timeout + backoff delay
     * - 3 retries with 5s timeout = up to 15s total latency
     * - Balance: reliability vs. user experience
     * 
     * Best Practice:
     * - Retry fast-failing operations (timeouts, connection errors)
     * - NO retry on business logic errors
     * - Monitor retry metrics (if high → investigate root cause)
     */
    @Min(value = 0, message = "retry-max-attempts cannot be negative")
    @Max(value = 5, message = "retry-max-attempts must not exceed 5")
    private int retryMaxAttempts = 3;
}


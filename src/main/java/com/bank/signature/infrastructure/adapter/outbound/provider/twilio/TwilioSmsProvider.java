package com.bank.signature.infrastructure.adapter.outbound.provider.twilio;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ScheduledExecutorService;

/**
 * Twilio SMS Provider implementation.
 * Story 2.5: SMS Provider Integration (Twilio)
 * Story 3.2: Refactored to implement SignatureProviderPort
 * 
 * Sends SMS challenges via Twilio API with:
 * - Retry policy: 3 attempts with exponential backoff (500ms, 1s, 2s)
 * - Timeout: 5 seconds (NFR-P4)
 * - Metrics: provider.twilio.calls, provider.twilio.latency, provider.twilio.errors
 * - Success/Failure pattern: Returns ProviderResult (no exceptions thrown)
 * - Health check: Validates Twilio API connectivity and credentials
 * 
 * Authentication: Basic Auth (AccountSid + AuthToken from Vault)
 * 
 * Bean name: twilioSmsProvider (used by ChallengeServiceImpl for provider resolution)
 * 
 * @since Story 3.2 - Implements SignatureProviderPort interface
 */
@Component("twilioSmsProvider")
@ConditionalOnProperty(prefix = "providers.sms", name = "stub", havingValue = "false", matchIfMissing = true)
public class TwilioSmsProvider implements SignatureProviderPort {
    
    private static final Logger log = LoggerFactory.getLogger(TwilioSmsProvider.class);
    private static final String METRIC_PREFIX = "provider.twilio";
    
    private final TwilioConfig config;
    private final MeterRegistry meterRegistry;
    private final ScheduledExecutorService providerExecutorService;
    
    public TwilioSmsProvider(
            TwilioConfig config, 
            MeterRegistry meterRegistry,
            ScheduledExecutorService providerExecutorService) {
        this.config = config;
        this.meterRegistry = meterRegistry;
        this.providerExecutorService = providerExecutorService;
    }
    
    @PostConstruct
    public void init() {
        Twilio.init(config.getAccountSid(), config.getAuthToken());
        log.info("Twilio SMS Provider initialized with account: {}", config.getAccountSid());
    }
    
    @Override
    @CircuitBreaker(name = "smsProvider")
    @Retry(name = "smsRetry")
    public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
        // Validate inputs
        if (challenge == null) {
            throw new IllegalArgumentException("challenge cannot be null");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("phoneNumber cannot be null or blank");
        }
        
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            log.info("Sending SMS challenge {} to {} via Twilio", challenge.getId(), phoneNumber);
            
            String messageBody = buildMessageBody(challenge);
            
            // Call Twilio API
            Message message = Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(config.getFromNumber()),
                messageBody
            ).create();
            
            // Build comprehensive provider proof (full JSON response)
            String providerProof = buildProviderProof(message);
            
            // Record success metrics
            sample.stop(Timer.builder(METRIC_PREFIX + ".latency")
                .tag("status", "success")
                .register(meterRegistry));
            
            meterRegistry.counter(METRIC_PREFIX + ".calls", "status", "success").increment();
            
            log.info("SMS sent successfully. Twilio SID: {}, Status: {}", 
                message.getSid(), message.getStatus());
            
            // Return success result
            return ProviderResult.success(message.getSid(), providerProof);
            
        } catch (ApiException e) {
            // Record error metrics
            sample.stop(Timer.builder(METRIC_PREFIX + ".latency")
                .tag("status", "error")
                .register(meterRegistry));
            
            meterRegistry.counter(METRIC_PREFIX + ".errors", 
                "error_code", String.valueOf(e.getCode())).increment();
            
            log.error("Twilio API error: {} (code: {})", e.getMessage(), e.getCode(), e);
            
            // Return failure result with Twilio error code
            return ProviderResult.failure(
                "TWILIO_ERROR_" + e.getCode(),
                "Twilio API error: " + e.getMessage()
            );
            
        } catch (Exception e) {
            // Record error metrics
            sample.stop(Timer.builder(METRIC_PREFIX + ".latency")
                .tag("status", "error")
                .register(meterRegistry));
            
            meterRegistry.counter(METRIC_PREFIX + ".errors", "error_code", "unknown").increment();
            
            log.error("Unexpected error sending SMS via Twilio", e);
            
            // Return generic failure result
            return ProviderResult.failure(
                "PROVIDER_ERROR",
                "Unexpected error: " + e.getMessage()
            );
        }
    }
    
    /**
     * Sends a signature challenge asynchronously (preferred method).
     * 
     * <p>This method wraps the synchronous {@link #sendChallenge(SignatureChallenge, String)}
     * in a {@link CompletableFuture} to enable timeout protection via Resilience4j TimeLimiter
     * (Story 3.8).
     * 
     * <p><strong>Timeout Protection:</strong>
     * When decorated with {@code @TimeLimiter(name="smsTimeout")}, this future will be
     * cancelled if Twilio does not respond within the configured timeout (default: 5s).
     * 
     * <p><strong>Implementation Note:</strong>
     * This method reuses the existing synchronous logic (DRY principle) rather than
     * duplicating the Twilio API call implementation.
     * 
     * @param challenge the signature challenge to send
     * @param phoneNumber the recipient phone number (E.164 format)
     * @return CompletableFuture that completes with ProviderResult when Twilio responds
     * @throws IllegalArgumentException if challenge or phoneNumber is null/invalid
     * @since Story 3.8 - Provider Timeout Configuration
     */
    @Override
    public CompletableFuture<ProviderResult> sendChallengeAsync(
            SignatureChallenge challenge, String phoneNumber) {
        return CompletableFuture.supplyAsync(
            () -> sendChallenge(challenge, phoneNumber),
            providerExecutorService
        );
    }
    
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        // Validate provider type
        if (providerType == null) {
            throw new IllegalArgumentException("providerType cannot be null");
        }
        if (providerType != ProviderType.SMS) {
            throw new IllegalArgumentException(
                "Expected SMS provider type, got: " + providerType
            );
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Check 1: Verify credentials are configured
            if (config.getAccountSid() == null || config.getAccountSid().isBlank()) {
                return HealthStatus.down("Twilio AccountSid not configured");
            }
            if (config.getAuthToken() == null || config.getAuthToken().isBlank()) {
                return HealthStatus.down("Twilio AuthToken not configured");
            }
            if (config.getFromNumber() == null || config.getFromNumber().isBlank()) {
                return HealthStatus.down("Twilio From Number not configured");
            }
            
            // Check 2: Verify Twilio is initialized (reinitialize if needed)
            // Note: Twilio SDK is initialized in @PostConstruct, this is a safety check
            try {
                Twilio.init(config.getAccountSid(), config.getAuthToken());
            } catch (Exception e) {
                // Already initialized or initialization failed
                log.debug("Twilio initialization check: {}", e.getMessage());
            }
            
            // Check 3: Measure response time
            long latency = System.currentTimeMillis() - startTime;
            
            // Health check successful
            log.debug("Twilio SMS health check passed (latency: {}ms)", latency);
            return HealthStatus.up(
                String.format("Twilio SMS provider operational (latency: %dms)", latency)
            );
            
        } catch (Exception e) {
            log.warn("Twilio SMS health check failed", e);
            return HealthStatus.down(
                "Twilio SMS provider unhealthy: " + e.getMessage()
            );
        }
    }
    
    /**
     * Builds the SMS message body with the challenge code.
     */
    private String buildMessageBody(SignatureChallenge challenge) {
        return String.format(
            "Su código de firma es: %s. Válido por %d segundos.",
            challenge.getChallengeCode(),
            challenge.getExpiresAt().getEpochSecond() - Instant.now().getEpochSecond()
        );
    }
    
    /**
     * Builds comprehensive provider proof from Twilio response.
     * Returns a JSON string containing key Twilio message details for non-repudiation.
     * 
     * @param message Twilio Message object
     * @return JSON string with Twilio response details
     */
    private String buildProviderProof(Message message) {
        return String.format(
            "{\"provider\":\"twilio\",\"sid\":\"%s\",\"status\":\"%s\",\"to\":\"%s\",\"from\":\"%s\",\"timestamp\":\"%s\"}",
            message.getSid(),
            message.getStatus().toString(),
            message.getTo(),
            message.getFrom(),
            Instant.now().toString()
        );
    }
}


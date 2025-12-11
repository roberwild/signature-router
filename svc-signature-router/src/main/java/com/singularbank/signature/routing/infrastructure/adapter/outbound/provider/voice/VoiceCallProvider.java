package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.voice;

import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.HealthStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderResult;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import com.singularbank.signature.routing.domain.port.outbound.SignatureProviderPort;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.twilio.TwilioConfig;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;
import com.twilio.type.Twiml;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ScheduledExecutorService;
import java.util.regex.Pattern;

/**
 * Voice Call Provider - Twilio Programmable Voice Implementation.
 * Story 3.4: Voice Call Provider - Twilio Voice API Integration
 * 
 * Production-ready Twilio Voice integration implementing SignatureProviderPort interface.
 * 
 * Features:
 * - Twilio Programmable Voice integration via twilio-java SDK
 * - ProviderResult success/failure pattern (no exceptions thrown)
 * - Text-to-Speech (TTS) en español con Amazon Polly voice
 * - Health check with configuration validation
 * - Prometheus metrics for monitoring
 * - TwiML generation for voice calls
 * - Phone number validation (E.164 format)
 * - Resilience4j retry and timeout
 * 
 * Architecture:
 * - Hexagonal Architecture: Implements SignatureProviderPort (domain interface)
 * - Domain purity: Returns domain value objects (ProviderResult, HealthStatus)
 * - Infrastructure layer: Twilio SDK dependency isolated here
 * 
 * TwiML Format:
 * - Say verb con voice="Polly.Mia" (español latinoamericano)
 * - Repite código 2 veces para claridad
 * - Digits separados para pronunciación clara
 * 
 * Bean name: voiceProvider (maps to ProviderType.VOICE)
 * 
 * @since Story 3.4
 * @see SignatureProviderPort
 * @see com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.twilio.TwilioSmsProvider Reference implementation
 */
@Component("voiceProvider")
@ConditionalOnProperty(prefix = "providers.voice", name = "enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class VoiceCallProvider implements SignatureProviderPort {
    
    private static final String METRIC_PREFIX = "provider.voice";
    private static final Pattern E164_PATTERN = Pattern.compile("^\\+[1-9]\\d{1,14}$");
    
    private final TwilioConfig twilioConfig;
    private final VoiceProviderConfig voiceConfig;
    private final MeterRegistry meterRegistry;
    private final ScheduledExecutorService providerExecutorService;
    
    // Health check cache (30 seconds TTL)
    private volatile HealthStatus cachedHealthStatus;
    private volatile Instant healthCheckTimestamp = Instant.EPOCH;
    private static final Duration HEALTH_CHECK_CACHE_TTL = Duration.ofSeconds(30);
    
    /**
     * Sends a signature challenge via Twilio Programmable Voice.
     * 
     * This method generates TwiML with Text-to-Speech, places a voice call
     * via Twilio API, and returns the result.
     * 
     * Success Case:
     * - Twilio returns a call SID
     * - ProviderResult.success(callSid, providerProof) returned
     * - Metrics recorded
     * 
     * Failure Cases:
     * - Invalid phone number → ProviderResult.failure("INVALID_PHONE_NUMBER", ...)
     * - Twilio API error → ProviderResult.failure("TWILIO_VOICE_ERROR_XXX", ...)
     * - Timeout → ProviderResult.failure("TIMEOUT", ...)
     * - Unexpected error → ProviderResult.failure("PROVIDER_ERROR", ...)
     * 
     * @param challenge The signature challenge containing OTP code
     * @param phoneNumber The phone number to call (E.164 format)
     * @return ProviderResult with success/failure status and provider proof
     * @throws IllegalArgumentException if challenge or phoneNumber is null/invalid
     */
    @Override
    @CircuitBreaker(name = "voiceProvider")
    @Retry(name = "voiceRetry")
    public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
        Objects.requireNonNull(challenge, "challenge cannot be null");
        Objects.requireNonNull(phoneNumber, "phoneNumber cannot be null");
        
        // Validate phone number format (E.164)
        if (!E164_PATTERN.matcher(phoneNumber).matches()) {
            throw new IllegalArgumentException(
                "Invalid phone number format. Expected E.164 format (e.g., +573001234567), got: " + phoneNumber
            );
        }
        
        log.info("Placing voice call: challengeId={}, phoneNumber={}", 
            challenge.getId(), maskPhoneNumber(phoneNumber));
        
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            // Build TwiML with TTS
            String twiml = buildTwiml(challenge);
            log.debug("Generated TwiML for challenge: {}", challenge.getId());
            
            // Place voice call via Twilio
            Call call = Call.creator(
                new PhoneNumber(phoneNumber),                        // To
                new PhoneNumber(twilioConfig.getFromNumber()),     // From
                new Twiml(twiml)                                   // TwiML
            ).create();
            
            // Build provider proof
            String providerProof = buildProviderProof(call, phoneNumber);
            
            // Record metrics
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "success"));
            meterRegistry.counter(METRIC_PREFIX + ".calls", "status", "success").increment();
            
            log.info("Voice call placed successfully: challengeId={}, callSid={}, status={}", 
                challenge.getId(), call.getSid(), call.getStatus());
            
            return ProviderResult.success(call.getSid(), providerProof);
            
        } catch (ApiException e) {
            String errorCode = "TWILIO_VOICE_ERROR_" + e.getCode();
            
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "error", "error_code", errorCode));
            meterRegistry.counter(METRIC_PREFIX + ".errors", "error_code", errorCode).increment();
            
            log.error("Twilio Voice API error: challengeId={}, errorCode={}, message={}", 
                challenge.getId(), errorCode, e.getMessage());
            
            return ProviderResult.failure(errorCode, e.getMessage());
            
        } catch (Exception e) {
            sample.stop(meterRegistry.timer(METRIC_PREFIX + ".latency", "status", "error", "error_code", "PROVIDER_ERROR"));
            meterRegistry.counter(METRIC_PREFIX + ".errors", "error_code", "PROVIDER_ERROR").increment();
            
            log.error("Unexpected error placing voice call: challengeId={}", 
                challenge.getId(), e);
            
            return ProviderResult.failure("PROVIDER_ERROR", e.getMessage());
        }
    }
    
    /**
     * Sends a signature challenge asynchronously via Twilio Voice (preferred method).
     * 
     * <p>This method wraps the synchronous {@link #sendChallenge(SignatureChallenge, String)}
     * in a {@link CompletableFuture} to enable timeout protection via Resilience4j TimeLimiter
     * (Story 3.8).
     * 
     * <p><strong>Timeout Protection:</strong>
     * When decorated with {@code @TimeLimiter(name="voiceTimeout")}, this future will be
     * cancelled if Twilio Voice API does not respond within the configured timeout (default: 10s).
     * 
     * <p><strong>Implementation Note:</strong>
     * This method reuses the existing synchronous logic (DRY principle) rather than
     * duplicating the Twilio Voice API call implementation.
     * 
     * @param challenge the signature challenge to send
     * @param phoneNumber the recipient phone number (E.164 format required)
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
    
    /**
     * Checks the health status of the Twilio Voice provider.
     * 
     * Health check validates:
     * 1. Twilio configuration is complete (accountSid, authToken, fromNumber)
     * 2. Voice configuration is valid (ttsVoice, ttsLanguage)
     * 
     * Results are cached for 30 seconds to avoid excessive checks.
     * 
     * @param providerType Must be ProviderType.VOICE
     * @return HealthStatus indicating UP or DOWN with details
     * @throws IllegalArgumentException if providerType is not VOICE
     */
    @Override
    public HealthStatus checkHealth(ProviderType providerType) {
        if (providerType != ProviderType.VOICE) {
            throw new IllegalArgumentException("Expected VOICE provider type, got: " + providerType);
        }
        
        // Return cached result if still valid
        Instant now = Instant.now();
        if (cachedHealthStatus != null && 
            Duration.between(healthCheckTimestamp, now).compareTo(HEALTH_CHECK_CACHE_TTL) < 0) {
            log.debug("Returning cached health status (age: {}s)", 
                Duration.between(healthCheckTimestamp, now).getSeconds());
            return cachedHealthStatus;
        }
        
        try {
            // Validate Twilio configuration
            if (twilioConfig.getAccountSid() == null || twilioConfig.getAccountSid().isBlank()) {
                HealthStatus status = HealthStatus.down("Twilio accountSid not configured");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            if (twilioConfig.getAuthToken() == null || twilioConfig.getAuthToken().isBlank()) {
                HealthStatus status = HealthStatus.down("Twilio authToken not configured");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            if (twilioConfig.getFromNumber() == null || twilioConfig.getFromNumber().isBlank()) {
                HealthStatus status = HealthStatus.down("Twilio fromNumber not configured");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            // Validate Voice configuration
            if (voiceConfig.getTtsVoice() == null || voiceConfig.getTtsVoice().isBlank()) {
                HealthStatus status = HealthStatus.down("TTS voice not configured");
                cacheHealthStatus(status, now);
                log.warn("Health check FAILED: {}", status.details());
                return status;
            }
            
            HealthStatus status = HealthStatus.up("Twilio Voice provider operational");
            cacheHealthStatus(status, now);
            log.debug("Health check PASSED: {}", status.details());
            return status;
            
        } catch (Exception e) {
            HealthStatus status = HealthStatus.down("Twilio Voice configuration error: " + e.getMessage());
            cacheHealthStatus(status, now);
            log.error("Health check FAILED with exception", e);
            return status;
        }
    }
    
    /**
     * Builds TwiML for voice call with Text-to-Speech.
     * 
     * TwiML Structure:
     * <pre>
     * &lt;Response&gt;
     *   &lt;Say voice="Polly.Mia" language="es-ES"&gt;
     *     Su código de firma es: 1 2 3 4 5 6. Repito, su código es: 1 2 3 4 5 6
     *   &lt;/Say&gt;
     * &lt;/Response&gt;
     * </pre>
     * 
     * Voice: Polly.Mia (Amazon Polly, español latinoamericano, mujer)
     * Language: es-ES (español)
     * 
     * @param challenge The signature challenge
     * @return TwiML string ready to send to Twilio
     */
    private String buildTwiml(SignatureChallenge challenge) {
        String code = challenge.getChallengeCode();
        
        // Format code as individual digits: "1 2 3 4 5 6"
        String digits = String.join(" ", code.split(""));
        
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Response>" +
            "  <Say voice=\"%s\" language=\"%s\">" +
            "    Su código de firma es: %s. Repito, su código es: %s" +
            "  </Say>" +
            "</Response>",
            voiceConfig.getTtsVoice(),
            voiceConfig.getTtsLanguage(),
            digits,
            digits
        );
    }
    
    /**
     * Builds provider proof as JSON string.
     * 
     * Format:
     * {
     *   "callSid": "Twilio call SID",
     *   "status": "queued/ringing/in-progress/completed",
     *   "to": "masked phone number",
     *   "from": "Twilio from number",
     *   "timestamp": "ISO-8601 timestamp",
     *   "provider": "TwilioVoice"
     * }
     * 
     * @param call Twilio Call object
     * @param phoneNumber Phone number (will be masked)
     * @return JSON string with provider proof
     */
    private String buildProviderProof(Call call, String phoneNumber) {
        return String.format(
            "{\"provider\":\"TwilioVoice\",\"callSid\":\"%s\",\"status\":\"%s\",\"to\":\"%s\",\"from\":\"%s\",\"timestamp\":\"%s\"}",
            call.getSid(),
            call.getStatus() != null ? call.getStatus().toString() : "unknown",
            maskPhoneNumber(phoneNumber),
            twilioConfig.getFromNumber(),
            Instant.now().toString()
        );
    }
    
    /**
     * Masks phone number for logging/proof (shows first 3 and last 4 digits).
     * 
     * Example: "+57300****567"
     * 
     * @param phoneNumber Phone number in E.164 format
     * @return Masked phone number
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() <= 7) {
            return "***";
        }
        int visibleStart = Math.min(6, phoneNumber.length() - 4);
        return phoneNumber.substring(0, visibleStart) + "****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
    
    /**
     * Caches health status with timestamp.
     */
    private void cacheHealthStatus(HealthStatus status, Instant timestamp) {
        this.cachedHealthStatus = status;
        this.healthCheckTimestamp = timestamp;
    }
}

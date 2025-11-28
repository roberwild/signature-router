package com.bank.signature.infrastructure.adapter.outbound.provider.stub;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Stub/Mock SMS Provider for local development without real Twilio credentials.
 * 
 * This provider simulates SMS sending by logging the message instead of actually
 * calling Twilio API. Useful for:
 * - Local development without Twilio account
 * - Integration testing
 * - Demo environments
 * 
 * Enable by setting: providers.sms.stub=true in application-local.yml
 */
@Component("twilioSmsProvider")
@ConditionalOnProperty(prefix = "providers.sms", name = "stub", havingValue = "true")
@Slf4j
public class StubSmsProvider implements SignatureProviderPort {
    
    private final Counter successCounter;
    private final Counter failureCounter;
    
    public StubSmsProvider(MeterRegistry meterRegistry) {
        this.successCounter = Counter.builder("provider.sms.stub.success")
                .description("Stub SMS provider successful sends")
                .register(meterRegistry);
        
        this.failureCounter = Counter.builder("provider.sms.stub.failure")
                .description("Stub SMS provider failed sends")
                .register(meterRegistry);
        
        log.info("🎭 STUB SMS Provider initialized (NO REAL SMS WILL BE SENT)");
    }
    
    @Override
    @CircuitBreaker(name = "smsProvider")
    @Retry(name = "twilioProvider")
    public ProviderResult sendChallenge(SignatureChallenge challenge, String phoneNumber) {
        if (challenge == null) {
            throw new IllegalArgumentException("Challenge cannot be null");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number cannot be null or empty");
        }
        
        // Simulate SMS sending
        String mockSid = "SM" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        String maskedPhone = maskPhoneNumber(phoneNumber);
        
        log.info("🎭 [STUB] Simulating SMS send:");
        log.info("   📱 To: {}", maskedPhone);
        log.info("   🔢 Challenge Code: {}", challenge.getChallengeCode());
        log.info("   📝 Message: 'Your signature verification code is: {}'", challenge.getChallengeCode());
        log.info("   ✅ Mock SID: {}", mockSid);
        
        // Simulate successful send
        successCounter.increment();
        
        return ProviderResult.success(mockSid, "Stub SMS sent successfully");
    }
    
    @Override
    public CompletableFuture<ProviderResult> sendChallengeAsync(SignatureChallenge challenge, String recipient) {
        // Stub async implementation - delegates to synchronous method
        return CompletableFuture.completedFuture(sendChallenge(challenge, recipient));
    }
    
    @Override
    public HealthStatus checkHealth(com.bank.signature.domain.model.valueobject.ProviderType providerType) {
        // Stub is always healthy
        return new HealthStatus(
                HealthStatus.Status.UP,
                "Stub SMS provider is operational (no real API calls)",
                Instant.now()
        );
    }
    
    /**
     * Masks phone number for logging (GDPR compliance).
     * Example: +34612345678 → +34****5678
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 8) {
            return "****";
        }
        
        int visibleStart = Math.min(3, phoneNumber.length() - 4);
        int visibleEnd = 4;
        
        String start = phoneNumber.substring(0, visibleStart);
        String end = phoneNumber.substring(phoneNumber.length() - visibleEnd);
        
        return start + "****" + end;
    }
}


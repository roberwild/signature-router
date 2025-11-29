package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ProviderType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Metrics component for challenge business metrics.
 * 
 * <p>Records Prometheus metrics for:
 * - challenges.sent.total (Counter): Total challenges sent by provider + channel
 * - challenges.completed.total (Counter): Total challenges completed by status
 * - challenges.duration.seconds (Histogram): Duration from sent to completed
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC3)
 * 
 * @author Signature Router Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChallengeMetrics {

    private final MeterRegistry meterRegistry;

    /**
     * Records challenge sent metrics.
     * 
     * <p>Increments counter: challenges.sent.total
     * Tags:
     * - provider: TWILIO|FCM|VOICE|BIOMETRIC
     * - channel: SMS|PUSH|VOICE|BIOMETRIC
     * 
     * <p>Example metric:
     * <pre>
     * challenges_sent_total{provider="TWILIO",channel="SMS"} 15.0
     * </pre>
     * 
     * @param challenge the sent signature challenge
     * @param provider the provider used to send the challenge
     */
    public void recordSent(SignatureChallenge challenge, ProviderType provider) {
        try {
            Counter.builder("challenges.sent.total")
                .description("Total challenges sent to providers")
                .tag("provider", provider.name())
                .tag("channel", challenge.getChannelType().name())
                .register(meterRegistry)
                .increment();
            
            log.debug("Recorded challenge sent: id={}, provider={}, channel={}", 
                challenge.getId(), provider, challenge.getChannelType());
                
        } catch (Exception e) {
            log.error("Failed to record challenge sent metric: id={}", challenge.getId(), e);
        }
    }

    /**
     * Records challenge completion metrics.
     * 
     * <p>Increments counter: challenges.completed.total
     * Tags:
     * - status: COMPLETED|FAILED|EXPIRED
     * 
     * <p>Records histogram: challenges.duration.seconds
     * Duration calculated from sentAt to completedAt (or now if null).
     * Buckets configured in application.yml: 5s, 10s, 30s, 1min, 5min, 10min
     * 
     * <p>Example metrics:
     * <pre>
     * challenges_completed_total{status="COMPLETED"} 12.0
     * challenges_duration_seconds_count 12
     * challenges_duration_seconds_sum 450.5
     * challenges_duration_seconds{quantile="0.95"} 45.2
     * </pre>
     * 
     * @param challenge the completed signature challenge
     */
    public void recordCompleted(SignatureChallenge challenge) {
        try {
            // Increment completion counter
            Counter.builder("challenges.completed.total")
                .description("Total challenges completed")
                .tag("status", challenge.getStatus().name())
                .register(meterRegistry)
                .increment();
            
            // Record duration histogram (if sentAt is available)
            if (challenge.getSentAt() != null) {
                Instant completedAt = challenge.getCompletedAt() != null 
                    ? challenge.getCompletedAt() 
                    : Instant.now();
                
                Duration duration = Duration.between(challenge.getSentAt(), completedAt);
                
                Timer.builder("challenges.duration.seconds")
                    .description("Duration of challenges from sent to completed")
                    .register(meterRegistry)
                    .record(duration.toMillis(), TimeUnit.MILLISECONDS);
                
                log.debug("Recorded challenge completed: id={}, status={}, duration={}s", 
                    challenge.getId(), challenge.getStatus(), duration.getSeconds());
            } else {
                log.debug("Recorded challenge completed: id={}, status={} (no sentAt, duration not recorded)", 
                    challenge.getId(), challenge.getStatus());
            }
                
        } catch (Exception e) {
            log.error("Failed to record challenge completed metric: id={}", challenge.getId(), e);
        }
    }
}


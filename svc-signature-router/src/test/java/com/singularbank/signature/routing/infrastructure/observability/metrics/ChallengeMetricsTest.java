package com.singularbank.signature.routing.infrastructure.observability.metrics;

import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.ChallengeStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ChallengeMetrics.
 * 
 * <p>Uses SimpleMeterRegistry (NOT mock) for realistic metric validation.
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC14)
 */
class ChallengeMetricsTest {

    private MeterRegistry meterRegistry;
    private ChallengeMetrics challengeMetrics;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        challengeMetrics = new ChallengeMetrics(meterRegistry);
    }

    @Test
    void shouldIncrementSentCounterWhenRecordSent() {
        // Given
        SignatureChallenge challenge = createChallenge(ChannelType.SMS, ProviderType.SMS, ChallengeStatus.SENT);

        // When
        challengeMetrics.recordSent(challenge, ProviderType.SMS);

        // Then
        Counter counter = meterRegistry.find("challenges.sent.total")
            .tag("provider", "SMS")
            .tag("channel", "SMS")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldApplyProviderAndChannelTagsCorrectly() {
        // Given
        SignatureChallenge smsChallenge = createChallenge(ChannelType.SMS, ProviderType.SMS, ChallengeStatus.SENT);
        SignatureChallenge pushChallenge = createChallenge(ChannelType.PUSH, ProviderType.PUSH, ChallengeStatus.SENT);

        // When
        challengeMetrics.recordSent(smsChallenge, ProviderType.SMS);
        challengeMetrics.recordSent(pushChallenge, ProviderType.PUSH);

        // Then
        Counter smsCounter = meterRegistry.find("challenges.sent.total")
            .tag("provider", "SMS")
            .tag("channel", "SMS")
            .counter();
        
        Counter pushCounter = meterRegistry.find("challenges.sent.total")
            .tag("provider", "PUSH")
            .tag("channel", "PUSH")
            .counter();
        
        assertThat(smsCounter).isNotNull();
        assertThat(smsCounter.count()).isEqualTo(1.0);
        
        assertThat(pushCounter).isNotNull();
        assertThat(pushCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldIncrementCompletedCounterWhenRecordCompleted() {
        // Given
        SignatureChallenge challenge = createCompletedChallenge(ChallengeStatus.COMPLETED);

        // When
        challengeMetrics.recordCompleted(challenge);

        // Then
        Counter counter = meterRegistry.find("challenges.completed.total")
            .tag("status", "COMPLETED")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldRecordDurationHistogramWhenRecordCompleted() {
        // Given
        Instant sentAt = Instant.now().minus(Duration.ofSeconds(30));
        SignatureChallenge challenge = createChallengeWithSentAt(sentAt, ChallengeStatus.COMPLETED);

        // When
        challengeMetrics.recordCompleted(challenge);

        // Then
        Timer timer = meterRegistry.find("challenges.duration.seconds")
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
        assertThat(timer.totalTime(TimeUnit.SECONDS)).isGreaterThanOrEqualTo(30);
    }

    @Test
    void shouldApplyStatusTagCorrectlyInCompletedMetric() {
        // Given
        SignatureChallenge completedChallenge = createCompletedChallengeWithSentAt(ChallengeStatus.COMPLETED);
        SignatureChallenge expiredChallenge = createCompletedChallengeWithSentAt(ChallengeStatus.EXPIRED);

        // When
        challengeMetrics.recordCompleted(completedChallenge);
        challengeMetrics.recordCompleted(expiredChallenge);

        // Then
        Counter completedCounter = meterRegistry.find("challenges.completed.total")
            .tag("status", "COMPLETED")
            .counter();
        
        Counter expiredCounter = meterRegistry.find("challenges.completed.total")
            .tag("status", "EXPIRED")
            .counter();
        
        assertThat(completedCounter.count()).isEqualTo(1.0);
        assertThat(expiredCounter.count()).isEqualTo(1.0);
    }

    @Test
    void shouldNotRecordDurationIfSentAtIsNull() {
        // Given
        SignatureChallenge challenge = createCompletedChallenge(ChallengeStatus.COMPLETED);

        // When
        challengeMetrics.recordCompleted(challenge);

        // Then
        // Counter should be incremented
        Counter counter = meterRegistry.find("challenges.completed.total")
            .tag("status", "COMPLETED")
            .counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
        
        // Timer should NOT be recorded
        Timer timer = meterRegistry.find("challenges.duration.seconds")
            .timer();
        assertThat(timer).isNull();
    }

    // Helper methods

    private SignatureChallenge createChallenge(ChannelType channelType, ProviderType providerType, ChallengeStatus status) {
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(channelType)
            .provider(providerType)
            .status(status)
            .challengeCode("123456")
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(Duration.ofMinutes(3)))
            .build();
    }

    private SignatureChallenge createCompletedChallenge(ChallengeStatus status) {
        // No sentAt - for testing duration not recorded
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(status)
            .challengeCode("123456")
            .createdAt(Instant.now().minus(Duration.ofSeconds(30)))
            .expiresAt(Instant.now().plus(Duration.ofMinutes(3)))
            .build();
    }

    private SignatureChallenge createCompletedChallengeWithSentAt(ChallengeStatus status) {
        Instant now = Instant.now();
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(status)
            .challengeCode("123456")
            .createdAt(now.minus(Duration.ofSeconds(60)))
            .sentAt(now.minus(Duration.ofSeconds(30)))
            .expiresAt(now.plus(Duration.ofMinutes(3)))
            .build();
    }

    private SignatureChallenge createChallengeWithSentAt(Instant sentAt, ChallengeStatus status) {
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(status)
            .challengeCode("123456")
            .createdAt(sentAt.minus(Duration.ofSeconds(10)))
            .sentAt(sentAt)
            .expiresAt(sentAt.plus(Duration.ofMinutes(3)))
            .build();
    }
}


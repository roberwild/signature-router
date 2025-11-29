package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.CompleteSignatureDto;
import com.bank.signature.application.dto.SignatureCompletionResponseDto;
import com.bank.signature.domain.event.SignatureCompletedEvent;
import com.bank.signature.domain.exception.ChallengeNotFoundException;
import com.bank.signature.domain.exception.InvalidChallengeCodeException;
import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.exception.NotFoundException;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChallengeStatus;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.port.outbound.EventPublisher;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import com.bank.signature.infrastructure.observability.metrics.ChallengeMetrics;
import com.bank.signature.infrastructure.observability.metrics.SignatureRequestMetrics;
import com.bank.signature.infrastructure.util.CorrelationIdProvider;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Implementation of {@link CompleteSignatureUseCase}.
 * Story 2.11: Signature Completion (User Response)
 * Story 5.1: Refactored to use Outbox pattern for event publishing
 * Story 9.2: Prometheus Metrics Export (@Timed annotation + metrics integration)
 * 
 * <p><b>Rate Limiting:</b> Max 3 attempts per challenge (in-memory counter).</p>
 * <p><b>Metrics:</b> Tracks completion success/failure and duration.</p>
 * <p><b>Outbox Pattern:</b> Events persisted in outbox_event table (same TX as aggregate)</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompleteSignatureUseCaseImpl implements CompleteSignatureUseCase {
    
    private static final int MAX_ATTEMPTS = 3;
    
    private final SignatureRequestRepository repository;
    private final EventPublisher eventPublisher;
    private final CorrelationIdProvider correlationIdProvider;
    private final MeterRegistry meterRegistry;
    private final SignatureRequestMetrics signatureRequestMetrics;
    private final ChallengeMetrics challengeMetrics;
    private final ObservationRegistry observationRegistry;
    
    // In-memory counter for challenge attempts (in production, use Redis)
    private final ConcurrentHashMap<UUID, AtomicInteger> attemptCounters = new ConcurrentHashMap<>();
    
    @Override
    @Transactional
    @Timed(value = "challenge.complete", 
           description = "Time to complete challenge", 
           percentiles = {0.5, 0.95, 0.99})
    public SignatureCompletionResponseDto execute(UUID signatureRequestId, CompleteSignatureDto request) {
        log.info("Completing signature request: signatureRequestId={}, challengeId={}", 
            signatureRequestId, request.challengeId());
        
        // 1. Load signature request aggregate
        SignatureRequest signatureRequest = repository.findById(signatureRequestId)
            .orElseThrow(() -> {
                log.warn("Signature request not found: id={}", signatureRequestId);
                return new NotFoundException("Signature request not found: " + signatureRequestId);
            });
        
        // 2. Find challenge within aggregate
        SignatureChallenge challenge = signatureRequest.findChallengeById(request.challengeId());
        
        // 3. Validate challenge status (must be SENT)
        if (challenge.getStatus() != ChallengeStatus.SENT) {
            log.warn("Challenge not in SENT status: id={}, status={}", 
                challenge.getId(), challenge.getStatus());
            throw new InvalidStateTransitionException(
                "Challenge not in valid state for completion. Current status: " + challenge.getStatus(),
                null,
                null
            );
        }
        
        // 4. Check if challenge expired
        if (challenge.isExpired()) {
            log.warn("Challenge expired: id={}, expiresAt={}", 
                challenge.getId(), challenge.getExpiresAt());
            challenge.expire();
            repository.save(signatureRequest);
            throw new InvalidStateTransitionException(
                "Challenge has expired",
                null,
                null
            );
        }
        
        // 5. Get attempt counter
        AtomicInteger attempts = attemptCounters.computeIfAbsent(
            challenge.getId(), 
            k -> new AtomicInteger(0)
        );
        
        // 6. Validate code (Story 9.4: Custom span for code validation)
        Observation.createNotStarted("challenge.code.validate", observationRegistry)
            .lowCardinalityKeyValue("challengeId", challenge.getId().toString())
            .lowCardinalityKeyValue("channelType", challenge.getChannelType().name())
            .observe(() -> {
                if (!challenge.validateCode(request.code())) {
                    int currentAttempt = attempts.incrementAndGet();
                    int remainingAttempts = MAX_ATTEMPTS - currentAttempt;
                    
                    log.warn("Invalid challenge code: challengeId={}, attempt={}/{}", 
                        challenge.getId(), currentAttempt, MAX_ATTEMPTS);
                    
                    // Fail challenge after max attempts
                    if (remainingAttempts <= 0) {
                        log.error("Max attempts exceeded for challenge: id={}", challenge.getId());
                        challenge.fail("MAX_ATTEMPTS_EXCEEDED");
                        repository.save(signatureRequest);
                        attemptCounters.remove(challenge.getId()); // Cleanup
                        
                        Counter.builder("signatures.completion.failed")
                            .tag("reason", "max_attempts")
                            .register(meterRegistry)
                            .increment();
                    }
                    
                    throw new InvalidChallengeCodeException(challenge.getId(), Math.max(0, remainingAttempts));
                }
                return null;
            });
        
        // 7. Complete challenge
        ProviderResult proof = ProviderResult.success(
            "USER_VERIFIED_" + challenge.getId(), 
            "code_matched_at_" + Instant.now()
        );
        challenge.complete(proof);
        
        // 8. Complete signature request (aggregate transition)
        signatureRequest.completeSignature(challenge);
        
        // 9. Save aggregate
        repository.save(signatureRequest);
        
        // 10. Cleanup attempt counter
        attemptCounters.remove(challenge.getId());
        
        // 11. Publish domain event (Story 5.1: Outbox pattern)
        SignatureCompletedEvent event = SignatureCompletedEvent.create(
            signatureRequest.getId(),
            challenge.getId(),
            challenge.getChannelType(),
            correlationIdProvider.getCorrelationId()
        );
        eventPublisher.publish(event); // Outbox pattern - persisted in same TX
        
        // 12. Record metrics (Story 9.2)
        signatureRequestMetrics.recordCompleted(signatureRequest);
        challengeMetrics.recordCompleted(challenge);
        
        log.info("Signature completed successfully: id={}, channel={}", 
            signatureRequest.getId(), challenge.getChannelType());
        
        return new SignatureCompletionResponseDto(
            signatureRequest.getId(),
            signatureRequest.getStatus(),
            signatureRequest.getSignedAt(),
            "Signature completed successfully"
        );
    }
}


package com.bank.signature.infrastructure.scheduler;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChallengeStatus;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureRequestEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.mapper.SignatureRequestEntityMapper;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.SignatureRequestJpaRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled job for expiring challenges that exceed their TTL.
 * Story 2.9: Challenge Expiration Background Job
 * 
 * <p><b>Execution Schedule:</b> Every 30 seconds (fixed delay)</p>
 * 
 * <p><b>Process:</b></p>
 * <ol>
 *   <li>Find signature requests with expired challenges (PENDING or SENT)</li>
 *   <li>Expire each challenge (status → EXPIRED)</li>
 *   <li>Update signature request status if needed</li>
 *   <li>Save changes in batch</li>
 *   <li>Record metrics</li>
 * </ol>
 * 
 * <p><b>Performance Considerations:</b></p>
 * <ul>
 *   <li>Batch limit: 1000 challenges per execution (avoid long-running job)</li>
 *   <li>Uses JOIN FETCH to avoid N+1 queries</li>
 *   <li>Single transaction per batch for consistency</li>
 * </ul>
 * 
 * <p><b>Distributed Lock:</b></p>
 * <ul>
 *   <li>TODO (Epic 4): Use ShedLock for multi-instance coordination</li>
 *   <li>For now: assumes single instance or optimistic locking</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChallengeExpirationScheduler {
    
    private static final int BATCH_SIZE = 1000;
    private static final String METRIC_PREFIX = "challenges.expired";
    
    private final SignatureRequestJpaRepository jpaRepository;
    private final SignatureRequestEntityMapper entityMapper;
    private final SignatureRequestRepository domainRepository;
    private final MeterRegistry meterRegistry;
    
    /**
     * Scheduled job that expires challenges every 30 seconds.
     * 
     * <p><b>Fixed Delay:</b> Waits 30s after previous execution completes
     * before starting next one (prevents overlapping executions).</p>
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    @Transactional
    public void expireExpiredChallenges() {
        Instant startTime = Instant.now();
        log.debug("Starting challenge expiration job");
        
        try {
            // 1. Find signature requests with expired challenges
            Instant currentTime = Instant.now();
            Pageable pageable = PageRequest.of(0, BATCH_SIZE);
            List<SignatureRequestEntity> entities = jpaRepository.findWithExpiredChallenges(
                currentTime, 
                pageable
            );
            
            if (entities.isEmpty()) {
                log.debug("No expired challenges found");
                return;
            }
            
            log.info("Found {} signature requests with expired challenges", entities.size());
            
            int expiredCount = 0;
            
            // 2. Process each signature request
            for (SignatureRequestEntity entity : entities) {
                try {
                    // Map to domain aggregate
                    SignatureRequest signatureRequest = entityMapper.toDomain(entity);
                    
                    // Find and expire challenges
                    for (SignatureChallenge challenge : signatureRequest.getChallenges()) {
                        if (shouldExpireChallenge(challenge, currentTime)) {
                            challenge.expire();
                            expiredCount++;
                            
                            log.info("Challenge expired: id={}, signatureRequestId={}, channelType={}", 
                                challenge.getId(), 
                                signatureRequest.getId(), 
                                challenge.getChannelType());
                        }
                    }
                    
                    // Check if signature request should also be expired
                    // (all challenges expired and no fallback possible)
                    if (shouldExpireSignatureRequest(signatureRequest)) {
                        signatureRequest.expire();
                        log.info("Signature request expired: id={}", signatureRequest.getId());
                    }
                    
                    // 3. Save updated aggregate
                    domainRepository.save(signatureRequest);
                    
                } catch (Exception e) {
                    log.error("Error expiring challenges for signature request: id={}", 
                        entity.getId(), e);
                    // Continue processing other requests
                }
            }
            
            // 4. Record metrics
            meterRegistry.counter(METRIC_PREFIX + ".count").increment(expiredCount);
            
            long durationMs = java.time.Duration.between(startTime, Instant.now()).toMillis();
            log.info("Challenge expiration job completed: expired={}, duration={}ms", 
                expiredCount, durationMs);
            
        } catch (Exception e) {
            log.error("Challenge expiration job failed", e);
            meterRegistry.counter(METRIC_PREFIX + ".errors").increment();
        }
    }
    
    /**
     * Determines if a challenge should be expired.
     * 
     * @param challenge The challenge to check
     * @param currentTime Current timestamp
     * @return true if challenge should be expired, false otherwise
     */
    private boolean shouldExpireChallenge(SignatureChallenge challenge, Instant currentTime) {
        // Only expire PENDING or SENT challenges
        if (challenge.getStatus() != ChallengeStatus.PENDING && 
            challenge.getStatus() != ChallengeStatus.SENT) {
            return false;
        }
        
        // Check if expired
        return challenge.getExpiresAt().isBefore(currentTime);
    }
    
    /**
     * Determines if a signature request should be expired.
     * 
     * <p>A signature request is expired if:</p>
     * <ul>
     *   <li>All challenges are expired/failed/completed</li>
     *   <li>No active challenges remain (PENDING or SENT)</li>
     * </ul>
     * 
     * @param signatureRequest The signature request to check
     * @return true if signature request should be expired, false otherwise
     */
    private boolean shouldExpireSignatureRequest(SignatureRequest signatureRequest) {
        // Check if any active challenges remain
        boolean hasActiveChallenge = signatureRequest.getChallenges().stream()
            .anyMatch(c -> c.getStatus() == ChallengeStatus.PENDING || 
                          c.getStatus() == ChallengeStatus.SENT);
        
        // If no active challenges, the request should be expired
        return !hasActiveChallenge && 
               signatureRequest.getStatus() == com.bank.signature.domain.model.valueobject.SignatureStatus.PENDING;
    }
}


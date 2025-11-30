package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.CreateSignatureRequestDto;
import com.bank.signature.application.mapper.SignatureMapper;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.model.valueobject.TransactionContext;
import com.bank.signature.domain.model.valueobject.UUIDGenerator;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import com.bank.signature.domain.service.ChallengeService;
import com.bank.signature.domain.service.PseudonymizationService;
import com.bank.signature.domain.service.RoutingService;
import com.bank.signature.domain.service.TransactionHashService;
import com.bank.signature.infrastructure.observability.metrics.SignatureRequestMetrics;
import com.bank.signature.infrastructure.ratelimit.CustomerRateLimitService;
import com.bank.signature.infrastructure.ratelimit.RateLimited;
import com.bank.signature.infrastructure.resilience.DegradedModeManager;
import io.micrometer.core.annotation.Timed;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;

/**
 * Implementation of StartSignatureUseCase.
 * Story 2.1: Create Signature Request Use Case
 * Story 2.3: Routing Engine - SpEL Evaluation (integrated)
 * Story 2.4: Challenge Creation & Provider Selection (integrated)
 * Story 4.3: Degraded Mode Manager (PENDING_DEGRADED status when degraded)
 * Story 9.2: Prometheus Metrics Export (@Timed annotation + SignatureRequestMetrics integration)
 * 
 * This use case orchestrates the creation of a new signature request
 * following the hexagonal architecture pattern.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StartSignatureUseCaseImpl implements StartSignatureUseCase {
    
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(3);
    
    private final SignatureRequestRepository repository;
    private final SignatureMapper mapper;
    private final PseudonymizationService pseudonymizationService;
    private final TransactionHashService transactionHashService;
    private final RoutingService routingService;
    private final ChallengeService challengeService;
    private final DegradedModeManager degradedModeManager;
    private final CustomerRateLimitService customerRateLimitService;
    private final SignatureRequestMetrics signatureRequestMetrics;
    private final ObservationRegistry observationRegistry;
    
    @Override
    @Transactional
    @RateLimited(name = "signatureCreation") // Global rate limit: 100/s (FR86)
    @Timed(value = "signature.request.create", 
           description = "Time to create signature request", 
           percentiles = {0.5, 0.95, 0.99})
    public SignatureRequest execute(CreateSignatureRequestDto request) {
        // Story 9.4: Create custom observation span for signature creation
        return Observation.createNotStarted("signature.request.create", observationRegistry)
            .lowCardinalityKeyValue("customerId", request.customerId())
            .observe(() -> {
                log.info("Starting signature request for customer: {}", request.customerId());
                
                // Critical Improvement #2: Customer-specific rate limit (10/min - FR85)
                customerRateLimitService.checkRateLimit(request.customerId());
                
                // 1. Pseudonymize customer ID (HMAC-SHA256)
                Observation.createNotStarted("signature.request.pseudonymize", observationRegistry)
                    .observe(() -> {
                        String pseudonymizedCustomerId = pseudonymizationService.pseudonymize(request.customerId());
                        log.debug("Customer ID pseudonymized");
                        return pseudonymizedCustomerId;
                    });
                
                String pseudonymizedCustomerId = pseudonymizationService.pseudonymize(request.customerId());
                
                // 2. Map DTO to domain TransactionContext
                TransactionContext transactionContext = mapper.toDomain(request);
                
                // 3. Calculate SHA-256 hash of transaction context
                String transactionHash = transactionHashService.calculateHash(transactionContext);
                TransactionContext contextWithHash = new TransactionContext(
                    transactionContext.amount(),
                    transactionContext.merchantId(),
                    transactionContext.orderId(),
                    transactionContext.description(),
                    transactionHash
                );
                log.debug("Transaction context hash calculated: {}", transactionHash);
                
                // 4. Evaluate routing rules to determine optimal channel (Story 2.3)
                RoutingService.RoutingDecision routingDecision = Observation.createNotStarted("signature.routing.evaluate", observationRegistry)
                    .lowCardinalityKeyValue("merchantId", contextWithHash.merchantId())
                    .observe(() -> routingService.evaluate(contextWithHash));
                    
                log.info("Routing evaluation completed: channel={}, defaultUsed={}", 
                    routingDecision.selectedChannel(), routingDecision.defaultChannelUsed());
        
        // 5. Build SignatureRequest aggregate with routing timeline
        Instant now = Instant.now();
        
        // Story 4.3: Set status to PENDING_DEGRADED if system in degraded mode
        SignatureStatus initialStatus = degradedModeManager.isInDegradedMode() 
            ? SignatureStatus.PENDING_DEGRADED 
            : SignatureStatus.PENDING;
        
        SignatureRequest signatureRequest = SignatureRequest.builder()
            .id(UUIDGenerator.generateV7())
            .customerId(pseudonymizedCustomerId)
            .transactionContext(contextWithHash)
            .status(initialStatus)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>(routingDecision.routingTimeline()))
            .createdAt(now)
            .expiresAt(now.plus(DEFAULT_TTL))
            .build();
        
                // 6. Create and send challenge for selected channel (Story 2.4, 2.5)
                // Story 4.3: ChallengeService will skip sending if degraded mode
                // Story 9.4: Custom span for challenge creation
                Observation.createNotStarted("signature.challenge.create", observationRegistry)
                    .lowCardinalityKeyValue("channel", routingDecision.selectedChannel().name())
                    .lowCardinalityKeyValue("degradedMode", String.valueOf(degradedModeManager.isInDegradedMode()))
                    .observe(() -> {
                        challengeService.createChallenge(signatureRequest, routingDecision.selectedChannel(), request.phoneNumber());
                        return null;
                    });
                
                if (degradedModeManager.isInDegradedMode()) {
                    log.warn("⚠️ Challenge created but NOT sent (degraded mode): id={}, channel={}", 
                        signatureRequest.getId(), routingDecision.selectedChannel());
                } else {
                    log.info("Challenge created and sent for channel: {}", routingDecision.selectedChannel());
                }
                
                // 7. Persist signature request (with challenge)
                SignatureRequest savedRequest = repository.save(signatureRequest);
                
                // Story 9.2: Record signature request created metric
                signatureRequestMetrics.recordCreated(savedRequest);
                
                log.info("Signature request created successfully: id={}, channel={}, challenges={}, expiresAt={}", 
                    savedRequest.getId(), 
                    routingDecision.selectedChannel(), 
                    savedRequest.getChallenges().size(),
                    savedRequest.getExpiresAt());
                
                return savedRequest;
            });
    }
}


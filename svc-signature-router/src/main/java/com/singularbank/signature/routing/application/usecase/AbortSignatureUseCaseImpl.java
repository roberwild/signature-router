package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.AbortSignatureDto;
import com.singularbank.signature.routing.application.dto.AbortSignatureResponseDto;
import com.singularbank.signature.routing.domain.event.SignatureAbortedEvent;
import com.singularbank.signature.routing.domain.exception.NotFoundException;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.port.outbound.EventPublisher;
import com.singularbank.signature.routing.domain.port.outbound.SignatureRequestRepository;
import com.singularbank.signature.routing.infrastructure.util.CorrelationIdProvider;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of {@link AbortSignatureUseCase}.
 * Story 2.12: Signature Abort (Admin Action)
 * Story 5.1: Refactored to use Outbox pattern for event publishing
 * 
 * <p><b>Security:</b> Endpoint requires ADMIN role (enforced at controller level).</p>
 * <p><b>Audit:</b> Publishes SIGNATURE_ABORTED event for audit trail.</p>
 * <p><b>Outbox Pattern:</b> Events persisted in outbox_event table (same TX as aggregate)</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AbortSignatureUseCaseImpl implements AbortSignatureUseCase {
    
    private final SignatureRequestRepository repository;
    private final EventPublisher eventPublisher;
    private final CorrelationIdProvider correlationIdProvider;
    private final MeterRegistry meterRegistry;
    
    @Override
    @Transactional
    public AbortSignatureResponseDto execute(UUID signatureRequestId, AbortSignatureDto request) {
        log.info("Aborting signature request: id={}, reason={}", signatureRequestId, request.reason());
        
        // 1. Load signature request aggregate
        SignatureRequest signatureRequest = repository.findById(signatureRequestId)
            .orElseThrow(() -> {
                log.warn("Signature request not found: id={}", signatureRequestId);
                return new NotFoundException("Signature request not found: " + signatureRequestId);
            });
        
        // 2. Abort signature (aggregate validates business rules and fails active challenges)
        signatureRequest.abort(request.reason(), request.details());
        
        // 3. Save aggregate
        repository.save(signatureRequest);
        
        // 4. Publish domain event (Story 5.1: Outbox pattern)
        SignatureAbortedEvent event = SignatureAbortedEvent.create(
            signatureRequest.getId(),
            request.reason(),
            request.details(),
            correlationIdProvider.getCorrelationId()
        );
        eventPublisher.publish(event); // Outbox pattern - persisted in same TX
        
        // 5. Record metrics
        Counter.builder("signatures.aborted")
            .tag("reason", request.reason().name())
            .register(meterRegistry)
            .increment();
        
        log.info("Signature aborted successfully: id={}, reason={}", 
            signatureRequest.getId(), request.reason());
        
        return new AbortSignatureResponseDto(
            signatureRequest.getId(),
            signatureRequest.getStatus(),
            signatureRequest.getAbortReason(),
            signatureRequest.getAbortedAt(),
            "Signature request aborted successfully"
        );
    }
}


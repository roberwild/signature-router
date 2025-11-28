package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.SignatureRequestDetailDto;
import com.bank.signature.application.mapper.SignatureMapper;
import com.bank.signature.domain.exception.NotFoundException;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of QuerySignatureUseCase.
 * Story 2.8: Query Signature Request (GET Endpoint)
 * 
 * Retrieves signature request from repository and maps to detailed DTO.
 * Uses read-only transaction for optimal performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuerySignatureUseCaseImpl implements QuerySignatureUseCase {
    
    private final SignatureRequestRepository repository;
    private final SignatureMapper mapper;
    
    @Override
    @Transactional(readOnly = true)
    public SignatureRequestDetailDto getSignatureRequest(UUID id) {
        log.debug("Querying signature request: id={}", id);
        
        // Retrieve signature request from repository
        SignatureRequest signatureRequest = repository.findById(id)
            .orElseThrow(() -> {
                log.warn("Signature request not found: id={}", id);
                return new NotFoundException("SignatureRequest", id.toString());
            });
        
        log.debug("Signature request found: id={}, status={}, challenges={}", 
            signatureRequest.getId(), 
            signatureRequest.getStatus(),
            signatureRequest.getChallenges().size());
        
        // Map to detailed DTO
        SignatureRequestDetailDto dto = mapper.toDetailDto(signatureRequest);
        
        log.info("Signature request retrieved successfully: id={}", id);
        
        return dto;
    }
}


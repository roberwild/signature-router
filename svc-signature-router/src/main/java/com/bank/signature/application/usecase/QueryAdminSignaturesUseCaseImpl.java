package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.SignatureRequestDetailDto;
import com.bank.signature.application.dto.response.AdminSignatureListResponse;
import com.bank.signature.application.mapper.SignatureMapper;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.Channel;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of Query Admin Signatures Use Case
 * Story 12.2: Admin Signatures Endpoint con Filtros
 * 
 * Queries signature requests with optional filters and pagination
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QueryAdminSignaturesUseCaseImpl implements QueryAdminSignaturesUseCase {
    
    private final SignatureRequestRepository signatureRequestRepository;
    private final SignatureMapper signatureMapper;
    
    /**
     * Execute query with filters and pagination
     * 
     * @param status    Optional status filter
     * @param channel   Optional channel filter
     * @param dateFrom  Optional start date filter
     * @param dateTo    Optional end date filter
     * @param pageable  Pagination and sorting configuration
     * @return Paginated response with signature requests
     */
    @Override
    @Transactional(readOnly = true)
    public AdminSignatureListResponse execute(
        SignatureStatus status,
        Channel channel,
        Instant dateFrom,
        Instant dateTo,
        Pageable pageable
    ) {
        log.info("Querying admin signatures: status={}, channel={}, dateFrom={}, dateTo={}, page={}, size={}",
            status, channel, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());
        
        // Query with filters
        Page<SignatureRequest> page = signatureRequestRepository.findAllWithFilters(
            status,
            channel,
            dateFrom,
            dateTo,
            pageable
        );
        
        // Map to DTOs
        List<SignatureRequestDetailDto> content = page.getContent().stream()
            .map(signatureMapper::toDetailDto)
            .collect(Collectors.toList());
        
        log.info("Found {} signature requests (total: {}, pages: {})",
            content.size(), page.getTotalElements(), page.getTotalPages());
        
        return AdminSignatureListResponse.builder()
            .content(content)
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .page(page.getNumber())
            .size(page.getSize())
            .build();
    }
}


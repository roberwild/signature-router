package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.response.AdminSignatureListResponse;
import com.singularbank.signature.routing.domain.model.valueobject.Channel;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

/**
 * Query Admin Signatures Use Case
 * Story 12.2: Admin Signatures Endpoint con Filtros
 * 
 * Returns paginated list of signature requests with optional filters
 */
public interface QueryAdminSignaturesUseCase {
    
    /**
     * Query signature requests with filters and pagination
     * 
     * @param status    Optional status filter
     * @param channel   Optional channel filter
     * @param dateFrom  Optional start date filter
     * @param dateTo    Optional end date filter
     * @param pageable  Pagination and sorting configuration
     * @return Paginated response with signature requests
     */
    AdminSignatureListResponse execute(
        SignatureStatus status,
        Channel channel,
        Instant dateFrom,
        Instant dateTo,
        Pageable pageable
    );
}


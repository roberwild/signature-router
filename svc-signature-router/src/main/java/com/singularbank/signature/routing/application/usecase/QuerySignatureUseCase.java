package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.SignatureRequestDetailDto;

import java.util.UUID;

/**
 * Use case for querying signature request details.
 * Story 2.8: Query Signature Request (GET Endpoint)
 * 
 * Retrieves complete information about a signature request including:
 * - Basic details (id, status, timestamps)
 * - Tokenized customer ID
 * - Active challenge (if any)
 * - Routing timeline (audit trail)
 */
public interface QuerySignatureUseCase {
    
    /**
     * Retrieves detailed information about a signature request.
     * 
     * @param id Signature request unique identifier
     * @return SignatureRequestDetailDto with complete information
     * @throws com.singularbank.signature.routing.domain.exception.NotFoundException if signature request not found
     */
    SignatureRequestDetailDto getSignatureRequest(UUID id);
}


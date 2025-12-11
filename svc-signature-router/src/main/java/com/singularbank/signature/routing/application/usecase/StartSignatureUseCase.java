package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.CreateSignatureRequestDto;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;

/**
 * Use case for starting a new signature request.
 * Story 2.1: Create Signature Request Use Case
 * 
 * This is an inbound port in hexagonal architecture that defines
 * the business operation to create a signature request.
 */
public interface StartSignatureUseCase {
    
    /**
     * Starts a new signature request process.
     * 
     * Creates a new SignatureRequest aggregate with:
     * - UUIDv7 identifier (time-sortable)
     * - Pseudonymized customer ID
     * - Immutable transaction context
     * - PENDING status
     * - 3-minute TTL (default)
     * - SHA-256 hash of transaction context
     * 
     * @param request The signature request details
     * @return The created SignatureRequest aggregate
     * @throws com.singularbank.signature.routing.domain.exception.DomainException if business rules violated
     */
    SignatureRequest execute(CreateSignatureRequestDto request);
}


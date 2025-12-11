package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.AbortSignatureDto;
import com.singularbank.signature.routing.application.dto.AbortSignatureResponseDto;
import com.singularbank.signature.routing.domain.exception.InvalidStateTransitionException;
import com.singularbank.signature.routing.domain.exception.NotFoundException;

import java.util.UUID;

/**
 * Use case for aborting a signature request (admin action).
 * Story 2.12: Signature Abort (Admin Action)
 */
public interface AbortSignatureUseCase {
    
    /**
     * Aborts a signature request with the specified reason.
     * 
     * <p><b>Business Rules:</b></p>
     * <ul>
     *   <li>Only PENDING signatures can be aborted</li>
     *   <li>All active challenges are marked as FAILED</li>
     *   <li>Publishes SIGNATURE_ABORTED event to Kafka</li>
     *   <li>Audit log includes admin user, reason, and timestamp</li>
     * </ul>
     * 
     * @param signatureRequestId The ID of the signature request to abort
     * @param request The abort request containing reason and optional details
     * @return A response DTO confirming the abort
     * @throws NotFoundException if signature request not found
     * @throws InvalidStateTransitionException if signature not in PENDING status
     */
    AbortSignatureResponseDto execute(UUID signatureRequestId, AbortSignatureDto request);
}


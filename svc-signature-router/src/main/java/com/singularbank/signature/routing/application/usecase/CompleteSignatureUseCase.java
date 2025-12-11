package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.CompleteSignatureDto;
import com.singularbank.signature.routing.application.dto.SignatureCompletionResponseDto;
import com.singularbank.signature.routing.domain.exception.ChallengeNotFoundException;
import com.singularbank.signature.routing.domain.exception.InvalidChallengeCodeException;
import com.singularbank.signature.routing.domain.exception.InvalidStateTransitionException;
import com.singularbank.signature.routing.domain.exception.NotFoundException;

import java.util.UUID;

/**
 * Use case for completing a signature request by validating the challenge code.
 * Story 2.11: Signature Completion (User Response)
 */
public interface CompleteSignatureUseCase {
    
    /**
     * Completes a signature request by validating the provided challenge code.
     * 
     * <p><b>Business Rules:</b></p>
     * <ul>
     *   <li>Challenge must be in SENT status (not EXPIRED/COMPLETED/FAILED)</li>
     *   <li>Code must match exactly the challenge code</li>
     *   <li>Maximum 3 attempts allowed per challenge</li>
     *   <li>After 3 failed attempts, challenge transitions to FAILED</li>
     * </ul>
     * 
     * @param signatureRequestId The ID of the signature request to complete
     * @param request The completion request containing challengeId and code
     * @return A response DTO confirming the completion
     * @throws NotFoundException if signature request not found
     * @throws ChallengeNotFoundException if challenge not found in the signature request
     * @throws InvalidChallengeCodeException if code is invalid (includes remaining attempts)
     * @throws InvalidStateTransitionException if challenge not in valid state
     */
    SignatureCompletionResponseDto execute(UUID signatureRequestId, CompleteSignatureDto request);
}


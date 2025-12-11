package com.singularbank.signature.routing.domain.exception;

/**
 * Exception thrown when attempting to create a challenge while another is still active.
 * Story 2.4: Challenge Creation & Provider Selection
 * 
 * Business rule: Only 1 challenge with status PENDING or SENT is allowed at a time.
 */
public class ActiveChallengeExistsException extends DomainException {
    
    public ActiveChallengeExistsException(String signatureRequestId) {
        super(
            "ACTIVE_CHALLENGE_EXISTS",
            String.format("Cannot create new challenge: SignatureRequest %s already has an active challenge (PENDING or SENT)", 
                signatureRequestId)
        );
    }
}


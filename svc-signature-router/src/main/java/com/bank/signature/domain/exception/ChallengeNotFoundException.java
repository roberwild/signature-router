package com.bank.signature.domain.exception;

import java.util.UUID;

/**
 * Exception thrown when a challenge is not found.
 * Story 2.11: Signature Completion (User Response)
 * 
 * @since Story 2.11
 */
public class ChallengeNotFoundException extends RuntimeException {
    
    private final UUID challengeId;
    
    public ChallengeNotFoundException(UUID challengeId) {
        super(String.format("Challenge not found with ID: %s", challengeId));
        this.challengeId = challengeId;
    }
    
    public UUID getChallengeId() {
        return challengeId;
    }
}


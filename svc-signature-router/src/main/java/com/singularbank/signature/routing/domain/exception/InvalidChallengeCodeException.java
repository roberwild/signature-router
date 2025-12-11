package com.singularbank.signature.routing.domain.exception;

import java.util.UUID;

/**
 * Exception thrown when an invalid challenge code is provided.
 * Story 2.11: Signature Completion (User Response)
 * 
 * @since Story 2.11
 */
public class InvalidChallengeCodeException extends RuntimeException {
    
    private final UUID challengeId;
    private final int remainingAttempts;
    
    public InvalidChallengeCodeException(UUID challengeId, int remainingAttempts) {
        super(String.format("Invalid challenge code for challenge ID: %s. Remaining attempts: %d", 
            challengeId, remainingAttempts));
        this.challengeId = challengeId;
        this.remainingAttempts = remainingAttempts;
    }
    
    public UUID getChallengeId() {
        return challengeId;
    }
    
    public int getRemainingAttempts() {
        return remainingAttempts;
    }
}


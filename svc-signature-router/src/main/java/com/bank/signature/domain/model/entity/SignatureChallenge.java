package com.bank.signature.domain.model.entity;

import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.model.valueobject.ChallengeStatus;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderResult;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a signature challenge (SMS OTP, Push notification, etc.).
 * 
 * <p><b>Lifecycle:</b> SENT → PENDING → COMPLETED (or FAILED, EXPIRED)</p>
 * 
 * @since Story 1.5
 */
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SignatureChallenge {
    
    private final UUID id;
    private final ChannelType channelType;
    private final ProviderType provider;
    private ChallengeStatus status;
    private final String challengeCode;  // OTP code generated for this challenge
    private final Instant createdAt;
    private Instant sentAt;
    private final Instant expiresAt;
    private Instant completedAt;
    private ProviderResult providerProof;
    private String errorCode;
    
    /**
     * Mark challenge as sent after successful provider call.
     * Story 2.5: SMS Provider Integration (Twilio)
     * Story 3.2: Updated for new ProviderResult format (uses timestamp field)
     * 
     * <p><b>Business Rule:</b> Challenge must be in PENDING status.</p>
     * 
     * @param providerResult Result from provider with challenge ID and proof
     * @throws InvalidStateTransitionException if challenge not in PENDING status
     */
    public void markAsSent(ProviderResult providerResult) {
        if (this.status != ChallengeStatus.PENDING) {
            throw new InvalidStateTransitionException(
                "Cannot mark as sent, status is not PENDING",
                null,
                null
            );
        }
        
        this.status = ChallengeStatus.SENT;
        this.sentAt = providerResult.timestamp();  // Story 3.2: Updated field name
        this.providerProof = providerResult;
    }
    
    /**
     * Validates if the provided code matches the challenge code.
     * Story 2.11: Signature Completion (User Response)
     * 
     * @param providedCode The code provided by the user
     * @return true if codes match, false otherwise
     */
    public boolean validateCode(String providedCode) {
        return this.challengeCode != null && this.challengeCode.equals(providedCode);
    }
    
    /**
     * Complete the challenge successfully.
     * Story 2.11: Updated to include validation
     * 
     * <p><b>Business Rule:</b> Challenge must be in SENT status.</p>
     * 
     * @param proof Provider completion proof (non-repudiation evidence)
     * @throws InvalidStateTransitionException if challenge not in SENT status
     */
    public void complete(ProviderResult proof) {
        if (this.status != ChallengeStatus.SENT) {
            throw new InvalidStateTransitionException(
                "Cannot complete challenge, status is not SENT",
                null,
                null
            );
        }
        
        this.status = ChallengeStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.providerProof = proof;
    }
    
    /**
     * Fail the challenge (e.g., wrong OTP, timeout, provider error).
     * 
     * <p><b>Business Rule:</b> Challenge must be in PENDING or SENT status.</p>
     * 
     * @param errorCode Provider error code (e.g., "TIMEOUT", "WRONG_OTP")
     * @throws InvalidStateTransitionException if challenge not in PENDING or SENT status
     */
    public void fail(String errorCode) {
        if (this.status != ChallengeStatus.PENDING && this.status != ChallengeStatus.SENT) {
            throw new InvalidStateTransitionException(
                "Cannot fail challenge, status is not PENDING or SENT",
                null,
                null
            );
        }
        
        this.status = ChallengeStatus.FAILED;
        this.errorCode = errorCode;
    }
    
    /**
     * Expires the challenge (TTL exceeded without user response).
     * Story 2.9: Challenge Expiration Background Job
     * 
     * <p><b>Business Rule:</b> Challenge must be in PENDING or SENT status.</p>
     * <p><b>Trigger:</b> Scheduled job finds challenges where expiresAt < NOW().</p>
     * 
     * @throws InvalidStateTransitionException if challenge not in PENDING or SENT status
     */
    public void expire() {
        if (this.status != ChallengeStatus.PENDING && this.status != ChallengeStatus.SENT) {
            throw new InvalidStateTransitionException(
                "Cannot expire challenge, status is not PENDING or SENT",
                null,
                null
            );
        }
        
        this.status = ChallengeStatus.EXPIRED;
        this.errorCode = "TTL_EXCEEDED";
    }
    
    /**
     * Checks if the challenge has expired.
     * Story 2.9: Challenge Expiration Background Job
     * 
     * @return true if current time is after expiresAt, false otherwise
     */
    public boolean isExpired() {
        return java.time.Instant.now().isAfter(this.expiresAt);
    }
}



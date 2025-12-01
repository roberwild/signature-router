package com.bank.signature.domain.model.aggregate;

import com.bank.signature.domain.exception.ChallengeAlreadyActiveException;
import com.bank.signature.domain.exception.ChallengeNotBelongsException;
import com.bank.signature.domain.exception.InvalidStateTransitionException;
import com.bank.signature.domain.exception.TtlNotExceededException;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.ChallengeStatus;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.model.valueobject.RoutingEvent;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.model.valueobject.TransactionContext;
import com.bank.signature.domain.model.valueobject.UUIDGenerator;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate root representing a signature request.
 * 
 * <p><b>Aggregate Boundary:</b> SignatureRequest controls the lifecycle of SignatureChallenge entities.</p>
 * 
 * <p><b>Business Rules:</b></p>
 * <ul>
 *   <li>Only 1 challenge with status PENDING allowed at a time</li>
 *   <li>State transitions must be explicit via business methods</li>
 *   <li>Routing timeline maintains audit trail of all events</li>
 * </ul>
 * 
 * @since Story 1.5
 */
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SignatureRequest {
    
    private final UUID id;
    private final String customerId;
    private final TransactionContext transactionContext;
    private SignatureStatus status;
    private final List<SignatureChallenge> challenges;
    private final List<RoutingEvent> routingTimeline;
    private final Instant createdAt;
    private final Instant expiresAt;
    private Instant signedAt;
    private Instant abortedAt;  // Story 2.12: Timestamp when aborted
    private com.bank.signature.domain.model.valueobject.AbortReason abortReason;  // Story 2.12: Reason for abort
    
    /**
     * Create a new signature challenge.
     * 
     * <p><b>Business Rule:</b> Only 1 challenge with status PENDING or SENT allowed simultaneously.</p>
     * <p><b>Story 2.4:</b> Updated to check for both PENDING and SENT status.</p>
     * 
     * @param channel Challenge delivery channel (SMS, PUSH, VOICE, BIOMETRIC)
     * @param provider Third-party provider (TWILIO, ONESIGNAL, etc.)
     * @return Created SignatureChallenge
     * @throws ChallengeAlreadyActiveException if a challenge with status PENDING or SENT already exists
     */
    public SignatureChallenge createChallenge(ChannelType channel, ProviderType provider) {
        // Validate: only 1 challenge with PENDING or SENT status allowed
        // Story 2.4: Check for both PENDING and SENT (active challenge)
        boolean hasActiveChallenge = challenges.stream()
            .anyMatch(c -> c.getStatus() == ChallengeStatus.PENDING || 
                          c.getStatus() == ChallengeStatus.SENT);
        
        if (hasActiveChallenge) {
            throw new ChallengeAlreadyActiveException(this.id);
        }
        
        // Create new challenge with PENDING status
        // Story 2.4: Challenge created in PENDING state, will transition to SENT after provider call
        // Story 2.5: Generate OTP code for challenge
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(UUIDGenerator.generateV7())
            .channelType(channel)
            .provider(provider)
            .status(ChallengeStatus.PENDING)  // Changed from SENT to PENDING
            .challengeCode(com.bank.signature.domain.util.OtpGenerator.generate())
            .createdAt(Instant.now())
            .expiresAt(this.expiresAt)  // Inherit TTL from SignatureRequest
            .build();
        
        // Update aggregate state
        this.challenges.add(challenge);
        
        // Add audit event to routing timeline
        this.routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "CHALLENGE_CREATED",
            null,
            channel,
            String.format("Challenge created for channel %s using provider %s", channel, provider)
        ));
        
        return challenge;
    }
    
    /**
     * Finds a challenge by its ID within this aggregate.
     * Story 2.11: Signature Completion (User Response)
     * 
     * @param challengeId The challenge ID to find
     * @return The found SignatureChallenge
     * @throws com.bank.signature.domain.exception.ChallengeNotFoundException if challenge not found
     */
    public SignatureChallenge findChallengeById(UUID challengeId) {
        return challenges.stream()
            .filter(c -> c.getId().equals(challengeId))
            .findFirst()
            .orElseThrow(() -> new com.bank.signature.domain.exception.ChallengeNotFoundException(challengeId));
    }
    
    /**
     * Complete the signature request after successful challenge completion.
     * Story 2.11: Updated to support challenge code validation
     * 
     * <p><b>Business Rules:</b></p>
     * <ul>
     *   <li>Challenge must belong to this aggregate</li>
     *   <li>Challenge must be in COMPLETED status</li>
     * </ul>
     * 
     * @param challenge The completed challenge
     * @throws ChallengeNotBelongsException if challenge does not belong to this aggregate
     * @throws InvalidStateTransitionException if challenge is not COMPLETED
     */
    public void completeSignature(SignatureChallenge challenge) {
        // Validate: challenge belongs to this aggregate
        if (!this.challenges.contains(challenge)) {
            throw new IllegalArgumentException(
                String.format("Challenge %s does not belong to SignatureRequest %s", 
                    challenge.getId(), this.id)
            );
        }
        
        // Validate: challenge is COMPLETED
        if (challenge.getStatus() != ChallengeStatus.COMPLETED) {
            throw new InvalidStateTransitionException(
                "Challenge must be in COMPLETED state to complete signature",
                this.status,
                SignatureStatus.SIGNED
            );
        }
        
        // Update aggregate state
        this.status = SignatureStatus.SIGNED;
        this.signedAt = Instant.now();
        
        // Add audit event
        this.routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "SIGNATURE_COMPLETED",
            challenge.getChannelType(),
            null,
            String.format("Signature completed via %s", challenge.getChannelType())
        ));
    }
    
    /**
     * Abort the signature request (e.g., fraud detection, user cancellation, admin intervention).
     * Story 2.12: Enhanced with AbortReason enum and active challenge handling
     * 
     * <p><b>Business Rules:</b></p>
     * <ul>
     *   <li>Can only abort if status is PENDING (not already SIGNED/ABORTED/EXPIRED)</li>
     *   <li>All active challenges (PENDING/SENT) are marked as FAILED</li>
     *   <li>Audit trail includes abort reason and timestamp</li>
     * </ul>
     * 
     * @param reason Abort reason enum (FRAUD_DETECTED, USER_CANCELLED, etc.)
     * @param details Optional additional details about the abort
     * @throws InvalidStateTransitionException if signature already completed/aborted
     */
    public void abort(com.bank.signature.domain.model.valueobject.AbortReason reason, String details) {
        // Validate: can only abort PENDING signatures
        if (this.status != SignatureStatus.PENDING) {
            throw new InvalidStateTransitionException(
                "Cannot abort signature with status: " + this.status,
                this.status,
                SignatureStatus.ABORTED
            );
        }
        
        // Fail all active challenges
        this.challenges.stream()
            .filter(c -> c.getStatus() == ChallengeStatus.PENDING || c.getStatus() == ChallengeStatus.SENT)
            .forEach(c -> c.fail("SIGNATURE_ABORTED"));
        
        // Update aggregate state
        this.status = SignatureStatus.ABORTED;
        this.abortedAt = Instant.now();
        this.abortReason = reason;
        
        // Add audit event
        String eventDetails = String.format("Reason: %s", reason);
        if (details != null && !details.isBlank()) {
            eventDetails += String.format(", Details: %s", details);
        }
        
        this.routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "SIGNATURE_ABORTED",
            null,
            null,
            eventDetails
        ));
    }
    
    /**
     * Abort signature with simple reason (backward compatibility).
     * Story 2.12: Abort Signature Request
     */
    public void abortSignature(com.bank.signature.domain.model.valueobject.AbortReason reason) {
        abort(reason, null);
    }
    
    /**
     * Expire the signature request (TTL exceeded).
     * 
     * <p><b>Business Rule:</b> TTL must be exceeded (current time > expiresAt).</p>
     * 
     * @throws TtlNotExceededException if TTL not exceeded yet
     */
    public void expire() {
        // Validate: TTL exceeded
        if (!Instant.now().isAfter(this.expiresAt)) {
            throw new TtlNotExceededException(this.id, this.expiresAt);
        }
        
        // Update aggregate state
        this.status = SignatureStatus.EXPIRED;
        
        // Add audit event
        this.routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "SIGNATURE_EXPIRED",
            null,
            null,
            "TTL_EXCEEDED"
        ));
    }
    
    /**
     * Mark signature as expired (convenience method for scheduler).
     */
    public void markAsExpired() {
        this.status = SignatureStatus.EXPIRED;
        this.routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "SIGNATURE_EXPIRED",
            null,
            null,
            "Marked as expired by scheduler"
        ));
    }
    
    /**
     * Check if signature request has expired.
     * 
     * @return true if current time is after expiresAt
     */
    public boolean isExpired() {
        return Instant.now().isAfter(this.expiresAt);
    }
    
    /**
     * Calculate remaining TTL (time to live).
     * 
     * @return Duration until expiration (negative if already expired)
     */
    public java.time.Duration getRemainingTTL() {
        return java.time.Duration.between(Instant.now(), this.expiresAt);
    }
}


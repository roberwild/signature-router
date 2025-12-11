package com.singularbank.signature.routing.domain.service;

import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;

/**
 * Domain service for challenge creation and management.
 * Story 2.4: Challenge Creation & Provider Selection
 * 
 * Orchestrates challenge creation including:
 * - Provider selection based on channel type
 * - Validation of business rules (1 active challenge max)
 * - Challenge lifecycle management
 */
public interface ChallengeService {
    
    /**
     * Creates and sends a new challenge for a signature request.
     * 
     * Process:
     * 1. Select provider based on channel type and availability
     * 2. Validate no active challenge exists (PENDING or SENT)
     * 3. Create challenge via SignatureRequest.createChallenge()
     * 4. Send challenge via provider (Story 2.5)
     * 5. Mark challenge as SENT if successful
     * 6. Return created challenge
     * 
     * @param signatureRequest The signature request aggregate
     * @param channelType The channel type determined by routing
     * @param phoneNumber User's phone number (or device token for Push)
     * @return The created SignatureChallenge
     * @throws com.singularbank.signature.routing.domain.exception.ChallengeAlreadyActiveException if active challenge exists
     * @throws com.singularbank.signature.routing.domain.exception.NoAvailableProviderException if no provider available
     * @throws com.singularbank.signature.routing.domain.exception.ProviderException if provider call fails
     */
    SignatureChallenge createChallenge(SignatureRequest signatureRequest, ChannelType channelType, String phoneNumber);
}


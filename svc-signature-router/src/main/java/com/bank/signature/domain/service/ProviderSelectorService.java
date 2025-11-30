package com.bank.signature.domain.service;

import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderType;

/**
 * Domain service for selecting the appropriate provider based on channel type.
 * Story 2.4: Challenge Creation & Provider Selection
 * 
 * Selects provider considering:
 * - Channel type (SMS → TWILIO, PUSH → FCM, etc.)
 * - Provider availability (not in degraded mode)
 * - Load balancing (future: multiple providers per channel)
 */
public interface ProviderSelectorService {
    
    /**
     * Selects the optimal provider for a given channel type.
     * 
     * Takes into account:
     * - Channel type mapping (SMS → TWILIO, PUSH → FCM, etc.)
     * - Provider health (excludes degraded providers)
     * - Load balancing strategy (round-robin, least-connections, etc.)
     * 
     * @param channelType The channel type to send the challenge through
     * @return The selected provider
     * @throws com.bank.signature.domain.exception.NoAvailableProviderException if no provider available
     */
    ProviderType selectProvider(ChannelType channelType);
    
    /**
     * Checks if a provider is available (not in degraded mode).
     * 
     * @param providerType The provider to check
     * @return true if available, false if degraded
     */
    boolean isProviderAvailable(ProviderType providerType);
}


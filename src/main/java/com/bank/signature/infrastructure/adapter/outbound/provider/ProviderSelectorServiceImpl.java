package com.bank.signature.infrastructure.adapter.outbound.provider;

import com.bank.signature.domain.exception.NoAvailableProviderException;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.service.ProviderSelectorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Implementation of ProviderSelectorService.
 * Story 2.4: Challenge Creation & Provider Selection
 * Story 3.1: Updated to use abstract provider types
 * 
 * Simple implementation with static mapping:
 * - SMS → ProviderType.SMS
 * - PUSH → ProviderType.PUSH
 * - VOICE → ProviderType.VOICE
 * - BIOMETRIC → ProviderType.BIOMETRIC
 * 
 * Future enhancements (Epic 4):
 * - Circuit breaker integration
 * - Degraded mode detection
 * - Multiple providers per channel with load balancing
 */
@Service
@Slf4j
public class ProviderSelectorServiceImpl implements ProviderSelectorService {
    
    // Static mapping: ChannelType → ProviderType
    // Story 3.1: Updated to use abstract provider types (not vendor-specific)
    private static final Map<ChannelType, ProviderType> CHANNEL_TO_PROVIDER = Map.of(
        ChannelType.SMS, ProviderType.SMS,
        ChannelType.PUSH, ProviderType.PUSH,
        ChannelType.VOICE, ProviderType.VOICE,
        ChannelType.BIOMETRIC, ProviderType.BIOMETRIC
    );
    
    @Override
    public ProviderType selectProvider(ChannelType channelType) {
        log.debug("Selecting provider for channel: {}", channelType);
        
        if (channelType == null) {
            throw new IllegalArgumentException("channelType cannot be null");
        }
        
        // Get mapped provider for channel
        ProviderType provider = CHANNEL_TO_PROVIDER.get(channelType);
        
        if (provider == null) {
            log.error("No provider mapping configured for channel: {}", channelType);
            throw new NoAvailableProviderException(channelType, "No provider configured");
        }
        
        // Check if provider is available (not in degraded mode)
        // For now, always return true (circuit breaker will be added in Epic 4)
        if (!isProviderAvailable(provider)) {
            log.warn("Provider {} is not available (degraded mode)", provider);
            throw new NoAvailableProviderException(channelType, 
                String.format("Provider %s is in degraded mode", provider));
        }
        
        log.info("Provider selected: {} for channel: {}", provider, channelType);
        return provider;
    }
    
    @Override
    public boolean isProviderAvailable(ProviderType providerType) {
        // For Story 2.4: Always return true (no circuit breaker yet)
        // Epic 4 will integrate with CircuitBreakerService
        log.debug("Checking availability for provider: {} (always true for now)", providerType);
        return true;
    }
}


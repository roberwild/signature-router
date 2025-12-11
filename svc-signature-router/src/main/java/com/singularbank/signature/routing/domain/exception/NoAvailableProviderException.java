package com.singularbank.signature.routing.domain.exception;

import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;

/**
 * Exception thrown when no provider is available for a given channel type.
 * Story 2.4: Challenge Creation & Provider Selection
 */
public class NoAvailableProviderException extends DomainException {
    
    public NoAvailableProviderException(ChannelType channelType) {
        super(
            "NO_AVAILABLE_PROVIDER",
            String.format("No available provider found for channel type: %s", channelType)
        );
    }
    
    public NoAvailableProviderException(ChannelType channelType, String reason) {
        super(
            "NO_AVAILABLE_PROVIDER",
            String.format("No available provider for channel %s: %s", channelType, reason)
        );
    }
}


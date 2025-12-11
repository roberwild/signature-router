package com.singularbank.signature.routing.infrastructure.config;

import com.singularbank.signature.routing.domain.model.valueobject.ChannelType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Fallback Chain Configuration.
 * Story 4-2: Fallback Chain Implementation
 * 
 * Configures fallback sequences for signature delivery channels.
 * When a provider fails, the system automatically attempts delivery via fallback channel.
 * 
 * Configuration Example (application.yml):
 * <pre>
 * fallback:
 *   enabled: true
 *   chains:
 *     SMS: VOICE      # SMS fails → try Voice
 *     PUSH: SMS       # Push fails → try SMS
 *     BIOMETRIC: SMS  # Biometric fails → try SMS
 *     VOICE: null     # Voice has no fallback (end of chain)
 * </pre>
 * 
 * Fallback Strategy:
 * - **SMS → VOICE**: If SMS not delivered, voice call more likely to reach user
 * - **PUSH → SMS**: If push not delivered (device offline), SMS fallback
 * - **BIOMETRIC → SMS**: If biometric not available, SMS universal fallback
 * - **VOICE → none**: Voice is already high-reach channel, no better fallback
 * 
 * Loop Prevention:
 * - Max 1 fallback per signature request
 * - Tracks attempted channels to prevent infinite loops
 * - Configurable chains prevent bidirectional fallback (SMS↔Voice)
 * 
 * Cost Considerations:
 * - Voice fallback increases cost (~10x SMS)
 * - But: Better UX + higher success rate justifies cost
 * - Can disable fallback in cost-sensitive scenarios
 * 
 * Circuit Breaker Integration:
 * - Fallback triggered when circuit breaker OPEN (CallNotPermittedException)
 * - Fallback provider might also have circuit OPEN → CHALLENGE_FAILED
 * 
 * @since Story 4-2
 */
@Configuration
@ConfigurationProperties(prefix = "fallback")
@Getter
@Setter
public class FallbackChainConfig {
    
    /**
     * Feature flag - fallback chains enabled/disabled.
     * Default: true (enabled)
     * 
     * When false:
     * - No fallback attempts
     * - Provider failure → CHALLENGE_FAILED immediately
     * - Lower delivery success rate, but also lower cost
     */
    private boolean enabled = true;
    
    /**
     * Fallback chain mappings: Primary Channel → Fallback Channel.
     * 
     * Key: Primary ChannelType (e.g., SMS, PUSH)
     * Value: Fallback ChannelType (e.g., VOICE, SMS) or null (no fallback)
     * 
     * Default Chains:
     * - SMS → VOICE (high-reach fallback)
     * - PUSH → SMS (universal fallback)
     * - BIOMETRIC → SMS (universal fallback)
     * - VOICE → null (no fallback, already high-reach)
     * 
     * Loop Prevention:
     * - VOICE does NOT fallback to SMS (prevents bidirectional loop)
     * - Max 1 fallback per request enforced in service layer
     */
    private Map<ChannelType, ChannelType> chains = new HashMap<>();
    
    /**
     * Gets fallback channel for a given primary channel.
     * 
     * @param primaryChannel The channel that failed
     * @return Fallback channel, or null if no fallback configured
     */
    public ChannelType getFallbackChannel(ChannelType primaryChannel) {
        return chains.get(primaryChannel);
    }
    
    /**
     * Checks if fallback is configured for a channel.
     * 
     * @param primaryChannel The channel to check
     * @return true if fallback exists, false otherwise
     */
    public boolean hasFallback(ChannelType primaryChannel) {
        return chains.containsKey(primaryChannel) && chains.get(primaryChannel) != null;
    }
}


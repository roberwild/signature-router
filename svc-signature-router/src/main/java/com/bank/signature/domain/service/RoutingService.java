package com.bank.signature.domain.service;

import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.RoutingEvent;
import com.bank.signature.domain.model.valueobject.TransactionContext;

import java.util.List;

/**
 * Domain service for routing decision engine.
 * Story 2.3: Routing Engine - SpEL Evaluation
 * 
 * Evaluates routing rules against transaction context to determine
 * the optimal channel for signature challenges.
 * 
 * Rules are evaluated in priority order (lower priority number = higher precedence).
 * First matching rule determines the channel (short-circuit evaluation).
 */
public interface RoutingService {
    
    /**
     * Evaluates routing rules and determines the optimal channel.
     * 
     * Rules are evaluated in ascending priority order until the first match.
     * If no rule matches, returns the default channel.
     * 
     * @param transactionContext Transaction context to evaluate against rules
     * @return RoutingDecision with selected channel and evaluation timeline
     */
    RoutingDecision evaluate(TransactionContext transactionContext);
    
    /**
     * Result of routing evaluation.
     * 
     * @param selectedChannel The channel selected by routing evaluation
     * @param routingTimeline List of routing events (rule evaluations)
     * @param defaultChannelUsed Whether the default channel was used (no rule matched)
     */
    record RoutingDecision(
        ChannelType selectedChannel,
        List<RoutingEvent> routingTimeline,
        boolean defaultChannelUsed
    ) {
        public RoutingDecision {
            if (selectedChannel == null) {
                throw new IllegalArgumentException("selectedChannel cannot be null");
            }
            if (routingTimeline == null) {
                routingTimeline = List.of();
            }
        }
    }
}


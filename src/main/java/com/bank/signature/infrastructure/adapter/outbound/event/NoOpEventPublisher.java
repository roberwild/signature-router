package com.bank.signature.infrastructure.adapter.outbound.event;

import com.bank.signature.domain.event.*;
import com.bank.signature.domain.port.outbound.EventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * No-op (stub) implementation of EventPublisher for local development when Kafka is disabled.
 * 
 * @since Local Dev
 */
@Component
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "false")
@Slf4j
public class NoOpEventPublisher implements EventPublisher {
    
    @Override
    public void publishSignatureCompleted(SignatureCompletedEvent event) {
        log.info("[NoOp] Would publish SignatureCompletedEvent: {}", event);
    }
    
    @Override
    public void publishSignatureAborted(SignatureAbortedEvent event) {
        log.info("[NoOp] Would publish SignatureAbortedEvent: {}", event);
    }
    
    // Circuit Breaker Events (Story 4.8)
    
    @Override
    public void publishCircuitBreakerOpened(CircuitBreakerOpenedEvent event) {
        log.info("[NoOp] Would publish CircuitBreakerOpenedEvent: provider={}, failureRate={}%", 
            event.providerType(), event.failureRate());
    }
    
    @Override
    public void publishCircuitBreakerHalfOpen(CircuitBreakerHalfOpenEvent event) {
        log.info("[NoOp] Would publish CircuitBreakerHalfOpenEvent: provider={}", 
            event.providerType());
    }
    
    @Override
    public void publishCircuitBreakerClosed(CircuitBreakerClosedEvent event) {
        log.info("[NoOp] Would publish CircuitBreakerClosedEvent: provider={}, recoveryDuration={}", 
            event.providerType(), event.recoveryDuration());
    }
    
    @Override
    public void publishCircuitBreakerFailedRecovery(CircuitBreakerFailedRecoveryEvent event) {
        log.info("[NoOp] Would publish CircuitBreakerFailedRecoveryEvent: provider={}, failureRate={}%", 
            event.providerType(), event.failureRate());
    }
    
    @Override
    public void publishCircuitBreakerReset(CircuitBreakerResetEvent event) {
        log.info("[NoOp] Would publish CircuitBreakerResetEvent: provider={}, resetBy={}, reason={}", 
            event.providerType(), event.resetBy(), event.resetReason());
    }
}


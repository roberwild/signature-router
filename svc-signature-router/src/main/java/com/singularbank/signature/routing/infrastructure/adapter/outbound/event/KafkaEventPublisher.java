package com.singularbank.signature.routing.infrastructure.adapter.outbound.event;

import com.singularbank.signature.routing.domain.event.*;
import com.singularbank.signature.routing.domain.port.outbound.EventPublisher;
import com.singularbank.signature.routing.infrastructure.observability.metrics.ProviderMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Kafka adapter for publishing domain events.
 * Story 2.11: Signature Completion (User Response)
 * Story 2.12: Signature Abort (Admin Action)
 * Story 4.8: Circuit Breaker Event Publishing
 * 
 * @since Story 2.11
 */
@Component
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher implements EventPublisher {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ProviderMetrics providerMetrics;
    
    @Value("${kafka.topics.signature-completed}")
    private String signatureCompletedTopic;
    
    @Value("${kafka.topics.signature-aborted}")
    private String signatureAbortedTopic;
    
    @Value("${kafka.topics.circuit-breaker-events:signature.circuit-breaker.events}")
    private String circuitBreakerEventsTopic;
    
    @Override
    public void publish(DomainEvent event) {
        log.debug("Publishing generic domain event: type={}, aggregateId={}", 
            event.getEventType(), event.getAggregateId());
        
        // Delegate to specific methods based on event type
        switch (event) {
            case SignatureCompletedEvent e -> publishSignatureCompleted(e);
            case SignatureAbortedEvent e -> publishSignatureAborted(e);
            case CircuitBreakerOpenedEvent e -> publishCircuitBreakerOpened(e);
            case CircuitBreakerHalfOpenEvent e -> publishCircuitBreakerHalfOpen(e);
            case CircuitBreakerClosedEvent e -> publishCircuitBreakerClosed(e);
            case CircuitBreakerFailedRecoveryEvent e -> publishCircuitBreakerFailedRecovery(e);
            case CircuitBreakerResetEvent e -> publishCircuitBreakerReset(e);
            default -> log.warn("Unknown event type: {}", event.getClass().getName());
        }
    }
    
    @Override
    public void publishAll(java.util.List<DomainEvent> events) {
        log.debug("Publishing {} domain events in batch", events.size());
        events.forEach(this::publish);
    }
    
    @Override
    public void publishSignatureCompleted(SignatureCompletedEvent event) {
        log.info("Publishing SignatureCompletedEvent: signatureRequestId={}, channel={}", 
            event.signatureRequestId(), event.channelType());
        
        try {
            kafkaTemplate.send(signatureCompletedTopic, event.signatureRequestId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish SignatureCompletedEvent: {}", event, ex);
                    } else {
                        log.debug("Event published successfully: topic={}, partition={}, offset={}", 
                            signatureCompletedTopic, 
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing SignatureCompletedEvent: {}", event, e);
            // In production, consider implementing a dead letter queue or retry mechanism
        }
    }
    
    @Override
    public void publishSignatureAborted(SignatureAbortedEvent event) {
        log.info("Publishing SignatureAbortedEvent: signatureRequestId={}, reason={}", 
            event.signatureRequestId(), event.reason());
        
        try {
            kafkaTemplate.send(signatureAbortedTopic, event.signatureRequestId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish SignatureAbortedEvent: {}", event, ex);
                    } else {
                        log.debug("Event published successfully: topic={}, partition={}, offset={}", 
                            signatureAbortedTopic, 
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing SignatureAbortedEvent: {}", event, e);
        }
    }
    
    // Circuit Breaker Events (Story 4.8)
    
    @Override
    public void publishCircuitBreakerOpened(CircuitBreakerOpenedEvent event) {
        String provider = event.providerType().name();
        String eventType = "OPENED";
        
        log.info("Circuit breaker event published: provider={}, event={}, failureRate={}%", 
            provider, eventType, event.failureRate());
        
        try {
            kafkaTemplate.send(circuitBreakerEventsTopic, provider, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish circuit breaker event: provider={}, event={}, error={}", 
                            provider, eventType, ex.getMessage(), ex);
                        providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
                    } else {
                        log.debug("Circuit breaker event published: topic={}, partition={}, offset={}", 
                            circuitBreakerEventsTopic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                        providerMetrics.recordCircuitBreakerEventPublished(provider, eventType);
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing CircuitBreakerOpenedEvent: provider={}, event={}", 
                provider, event, e);
            providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
        }
    }
    
    @Override
    public void publishCircuitBreakerHalfOpen(CircuitBreakerHalfOpenEvent event) {
        String provider = event.providerType().name();
        String eventType = "HALF_OPEN";
        
        log.info("Circuit breaker event published: provider={}, event={}", provider, eventType);
        
        try {
            kafkaTemplate.send(circuitBreakerEventsTopic, provider, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish circuit breaker event: provider={}, event={}, error={}", 
                            provider, eventType, ex.getMessage(), ex);
                        providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
                    } else {
                        log.debug("Circuit breaker event published: topic={}, partition={}, offset={}", 
                            circuitBreakerEventsTopic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                        providerMetrics.recordCircuitBreakerEventPublished(provider, eventType);
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing CircuitBreakerHalfOpenEvent: provider={}, event={}", 
                provider, event, e);
            providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
        }
    }
    
    @Override
    public void publishCircuitBreakerClosed(CircuitBreakerClosedEvent event) {
        String provider = event.providerType().name();
        String eventType = "CLOSED";
        
        log.info("Circuit breaker event published: provider={}, event={}, recoveryDuration={}", 
            provider, eventType, event.recoveryDuration());
        
        try {
            kafkaTemplate.send(circuitBreakerEventsTopic, provider, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish circuit breaker event: provider={}, event={}, error={}", 
                            provider, eventType, ex.getMessage(), ex);
                        providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
                    } else {
                        log.debug("Circuit breaker event published: topic={}, partition={}, offset={}", 
                            circuitBreakerEventsTopic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                        providerMetrics.recordCircuitBreakerEventPublished(provider, eventType);
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing CircuitBreakerClosedEvent: provider={}, event={}", 
                provider, event, e);
            providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
        }
    }
    
    @Override
    public void publishCircuitBreakerFailedRecovery(CircuitBreakerFailedRecoveryEvent event) {
        String provider = event.providerType().name();
        String eventType = "FAILED_RECOVERY";
        
        log.warn("Circuit breaker event published: provider={}, event={}, failureRate={}%", 
            provider, eventType, event.failureRate());
        
        try {
            kafkaTemplate.send(circuitBreakerEventsTopic, provider, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish circuit breaker event: provider={}, event={}, error={}", 
                            provider, eventType, ex.getMessage(), ex);
                        providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
                    } else {
                        log.debug("Circuit breaker event published: topic={}, partition={}, offset={}", 
                            circuitBreakerEventsTopic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                        providerMetrics.recordCircuitBreakerEventPublished(provider, eventType);
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing CircuitBreakerFailedRecoveryEvent: provider={}, event={}", 
                provider, event, e);
            providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
        }
    }
    
    @Override
    public void publishCircuitBreakerReset(CircuitBreakerResetEvent event) {
        String provider = event.providerType().name();
        String eventType = "RESET";
        
        log.info("Circuit breaker event published: provider={}, event={}, resetBy={}, reason={}", 
            provider, eventType, event.resetBy(), event.resetReason());
        
        try {
            kafkaTemplate.send(circuitBreakerEventsTopic, provider, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish circuit breaker event: provider={}, event={}, error={}", 
                            provider, eventType, ex.getMessage(), ex);
                        providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
                    } else {
                        log.debug("Circuit breaker event published: topic={}, partition={}, offset={}", 
                            circuitBreakerEventsTopic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                        providerMetrics.recordCircuitBreakerEventPublished(provider, eventType);
                    }
                });
        } catch (Exception e) {
            log.error("Error publishing CircuitBreakerResetEvent: provider={}, event={}", 
                provider, event, e);
            providerMetrics.recordCircuitBreakerEventPublishFailed(provider, eventType);
        }
    }
}


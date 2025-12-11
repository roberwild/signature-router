package com.singularbank.signature.routing.infrastructure.config;

import com.singularbank.signature.routing.infrastructure.resilience.CircuitBreakerEventListener;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for registering CircuitBreakerEventListener with Resilience4j circuit breakers.
 * 
 * <p>This configuration ensures that all circuit breaker state transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
 * trigger domain event publishing to Kafka for observability and monitoring.
 * 
 * <p><strong>Lifecycle:</strong>
 * <ul>
 * <li>@PostConstruct: After bean creation, register event listeners for all circuit breakers</li>
 * <li>Events: onStateTransition, onReset</li>
 * <li>Circuit Breakers: smsProvider, pushProvider, voiceProvider, biometricProvider</li>
 * </ul>
 * 
 * <p><strong>Configuration Source:</strong> application.yml
 * <pre>
 * resilience4j:
 *   circuitbreaker:
 *     instances:
 *       smsProvider:
 *         failure-rate-threshold: 50  # % (Story 4-1)
 *         wait-duration-in-open-state: 30s
 *         sliding-window-size: 10
 *       pushProvider: ...
 *       voiceProvider: ...
 *       biometricProvider: ...
 * </pre>
 * 
 * <p><strong>Event Flow:</strong>
 * <pre>
 * Provider Call Fails (failure rate > 50%)
 *   ↓
 * Circuit Breaker transitions CLOSED → OPEN
 *   ↓
 * CircuitBreakerEventListener.onStateTransition() triggered
 *   ↓
 * CircuitBreakerOpenedEvent published to Kafka topic signature.circuit-breaker.events
 *   ↓
 * Consumers (Monitoring, Analytics, Dashboard) react to event
 * </pre>
 * 
 * @since Story 4-8 - Circuit Breaker Event Publishing
 * @see CircuitBreakerEventListener
 * @see io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent
 */
@Configuration
@ConditionalOnProperty(prefix = "resilience4j", name = "circuitbreaker.enabled", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class CircuitBreakerEventConfiguration {
    
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final CircuitBreakerEventListener circuitBreakerEventListener;
    
    /**
     * Register event listeners for all circuit breakers after bean initialization.
     * 
     * <p>This method iterates over all circuit breaker instances registered in CircuitBreakerRegistry
     * and attaches the CircuitBreakerEventListener to listen for:
     * <ul>
     * <li>onStateTransition: CLOSED ↔ OPEN ↔ HALF_OPEN</li>
     * <li>onReset: Manual reset by admin</li>
     * </ul>
     * 
     * <p><strong>Expected Circuit Breakers:</strong>
     * <ul>
     * <li>smsProvider (Twilio SMS)</li>
     * <li>pushProvider (Firebase Cloud Messaging)</li>
     * <li>voiceProvider (Twilio Voice API)</li>
     * <li>biometricProvider (Future: Biometric SDK)</li>
     * </ul>
     * 
     * <p><strong>Error Handling:</strong>
     * If registration fails for any circuit breaker, the error is logged but NOT re-thrown.
     * This prevents application startup failure due to circuit breaker event configuration issues.
     */
    @PostConstruct
    public void registerEventListeners() {
        try {
            int registeredCount = 0;
            StringBuilder circuitBreakerNames = new StringBuilder();
            
            // Iterate over all circuit breakers and register event listener
            for (CircuitBreaker circuitBreaker : circuitBreakerRegistry.getAllCircuitBreakers()) {
                String name = circuitBreaker.getName();
                
                log.debug("Registering event listeners for circuit breaker: {}", name);
                
                // Register state transition listener
                circuitBreaker.getEventPublisher()
                    .onStateTransition(circuitBreakerEventListener::onStateTransition);
                
                // Register reset listener (manual admin action)
                circuitBreaker.getEventPublisher()
                    .onReset(circuitBreakerEventListener::onReset);
                
                registeredCount++;
                if (circuitBreakerNames.length() > 0) {
                    circuitBreakerNames.append(", ");
                }
                circuitBreakerNames.append(name);
            }
            
            if (registeredCount == 0) {
                log.warn("No circuit breakers found in CircuitBreakerRegistry. " +
                    "Verify that resilience4j.circuitbreaker.instances are configured in application.yml");
            } else {
                log.info("Circuit breaker event listeners registered for {} instance(s): {}", 
                    registeredCount, circuitBreakerNames.toString());
            }
            
        } catch (Exception e) {
            log.error("Failed to register circuit breaker event listeners. " +
                "Circuit breaker events will NOT be published to Kafka. Error: {}", 
                e.getMessage(), e);
            // DO NOT re-throw - event publishing is non-critical for application startup
        }
    }
}


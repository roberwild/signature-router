package com.bank.signature.infrastructure.util;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility component for managing correlation IDs across distributed transactions.
 * 
 * <p><strong>Purpose:</strong></p>
 * <ul>
 *   <li>Extract correlation ID from MDC (set by HTTP filter)</li>
 *   <li>Generate new correlation ID if not present</li>
 *   <li>Propagate correlation ID through domain events</li>
 *   <li>Enable distributed tracing across services</li>
 * </ul>
 * 
 * <p><strong>Flow:</strong></p>
 * <pre>
 * 1. HTTP Request → CorrelationFilter sets MDC("correlationId", UUID)
 * 2. Use Case → CorrelationIdProvider.getCorrelationId()
 * 3. Domain Event → event.correlationId = correlation ID
 * 4. Kafka Event → trace_id field = correlation ID
 * 5. Consumer → can correlate events across services
 * </pre>
 * 
 * <p><strong>MDC Key:</strong></p>
 * Uses "correlationId" as MDC key. Must match CorrelationFilter configuration.
 * 
 * @see org.slf4j.MDC
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@Component
public class CorrelationIdProvider {
    
    /**
     * MDC key for correlation ID.
     * MUST match key used in CorrelationFilter.
     */
    private static final String CORRELATION_ID_KEY = "correlationId";
    
    /**
     * Get current correlation ID from MDC, or generate new one if absent.
     * 
     * <p><strong>Behavior:</strong></p>
     * <ul>
     *   <li>If MDC contains correlation ID → return it</li>
     *   <li>If MDC empty or null → generate new UUID and set in MDC</li>
     * </ul>
     * 
     * <p><strong>Thread Safety:</strong></p>
     * MDC is thread-local, so this method is safe for concurrent use.
     * 
     * @return Correlation ID (never null)
     */
    public String getCorrelationId() {
        String correlationId = MDC.get(CORRELATION_ID_KEY);
        
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
            MDC.put(CORRELATION_ID_KEY, correlationId);
        }
        
        return correlationId;
    }
    
    /**
     * Set correlation ID in MDC.
     * Useful for async operations or manual correlation ID propagation.
     * 
     * @param correlationId Correlation ID to set
     */
    public void setCorrelationId(String correlationId) {
        if (correlationId != null && !correlationId.isBlank()) {
            MDC.put(CORRELATION_ID_KEY, correlationId);
        }
    }
    
    /**
     * Clear correlation ID from MDC.
     * Should be called at end of request processing to avoid memory leaks.
     */
    public void clearCorrelationId() {
        MDC.remove(CORRELATION_ID_KEY);
    }
}


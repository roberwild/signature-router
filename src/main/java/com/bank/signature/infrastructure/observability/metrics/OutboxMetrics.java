package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.OutboxEventRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Prometheus metrics for Outbox pattern monitoring.
 * 
 * <p><strong>Metrics Exposed:</strong></p>
 * <ul>
 *   <li>outbox.events.pending - Gauge of events not yet published to Kafka</li>
 * </ul>
 * 
 * <p><strong>Purpose:</strong></p>
 * <ul>
 *   <li>Monitor Debezium lag (if pending events growing → Debezium issue)</li>
 *   <li>Alert on high pending count (>100 events = investigate)</li>
 *   <li>Track outbox table size for retention policy</li>
 * </ul>
 * 
 * <p><strong>Grafana Dashboard:</strong></p>
 * <pre>
 * Panel: Outbox Pending Events
 * Query: outbox_events_pending
 * Alert: if > 100 for 5 minutes → page on-call
 * </pre>
 * 
 * @since Story 5.1 - Outbox Pattern Implementation
 */
@Slf4j
@Component
public class OutboxMetrics {
    
    private final OutboxEventRepository outboxRepository;
    
    public OutboxMetrics(
        OutboxEventRepository outboxRepository,
        MeterRegistry meterRegistry
    ) {
        this.outboxRepository = outboxRepository;
        
        // Gauge: Pending events count
        Gauge.builder("outbox.events.pending", outboxRepository, repo -> {
                try {
                    return repo.countPendingEvents();
                } catch (Exception e) {
                    log.error("Failed to count pending outbox events", e);
                    return -1.0; // Negative value indicates metric error
                }
            })
            .description("Number of outbox events not yet published to Kafka")
            .tag("component", "outbox")
            .register(meterRegistry);
            
        log.info("Outbox metrics registered successfully");
    }
}


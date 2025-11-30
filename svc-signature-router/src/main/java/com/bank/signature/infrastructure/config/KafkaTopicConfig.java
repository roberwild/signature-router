package com.bank.signature.infrastructure.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka topic configuration for Signature Router event streams.
 * 
 * <p><b>Topics:</b></p>
 * <ul>
 *   <li><b>signature.events:</b> Main event stream (12 partitions, 7 days retention)</li>
 *   <li><b>signature.events.dlq:</b> Dead Letter Queue (3 partitions, 30 days retention)</li>
 * </ul>
 * 
 * <p><b>Partitioning Strategy:</b></p>
 * <ul>
 *   <li>Key: SignatureRequest.aggregateId (UUIDv7)</li>
 *   <li>Benefit: All events for a request go to same partition (order guarantee)</li>
 *   <li>Throughput: 12 partitions allow up to 12 parallel consumers</li>
 * </ul>
 * 
 * <p><b>Environment-Specific Configuration:</b></p>
 * <ul>
 *   <li><b>Dev/Local:</b> replicas=1 (single Kafka broker)</li>
 *   <li><b>UAT:</b> replicas=2 (high availability testing)</li>
 *   <li><b>Prod:</b> replicas=3 (banking-grade high availability)</li>
 * </ul>
 * 
 * <p><b>Note:</b> These topics are auto-created in dev (spring.kafka.admin.auto-create=true).
 * In UAT/Prod, topics MUST be pre-created by Ops team with proper replication factor.</p>
 * 
 * @see com.bank.signature.infrastructure.config.KafkaConfig
 * @since Story 1.3
 */
@Configuration
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KafkaTopicConfig {

    /**
     * Main event stream topic for signature lifecycle events.
     * 
     * <p><b>Configuration:</b></p>
     * <ul>
     *   <li>Name: signature.events</li>
     *   <li>Partitions: 12 (high throughput, parallel consumers)</li>
     *   <li>Replicas: 1 (dev), 3 (prod)</li>
     *   <li>Retention: 7 days (168 hours)</li>
     *   <li>Compression: snappy (network efficiency)</li>
     * </ul>
     * 
     * <p><b>Event Types Published:</b></p>
     * <ul>
     *   <li>SIGNATURE_REQUEST_CREATED</li>
     *   <li>CHALLENGE_SENT</li>
     *   <li>CHALLENGE_COMPLETED</li>
     *   <li>CHALLENGE_FAILED</li>
     *   <li>SIGNATURE_COMPLETED</li>
     *   <li>SIGNATURE_FAILED</li>
     *   <li>FALLBACK_TRIGGERED</li>
     *   <li>PROVIDER_DEGRADED</li>
     * </ul>
     * 
     * @return NewTopic bean for signature.events
     */
    @Bean
    public NewTopic signatureEventsTopic() {
        return TopicBuilder.name("signature.events")
                .partitions(12)  // High throughput (parallel consumers)
                .replicas(1)     // Dev: 1, Prod: 3 (change in Ops team pre-creation)
                .config("retention.ms", String.valueOf(7 * 24 * 60 * 60 * 1000L))  // 7 days
                .config("compression.type", "snappy")
                .build();
    }

    /**
     * Dead Letter Queue (DLQ) topic for failed message processing.
     * 
     * <p><b>Configuration:</b></p>
     * <ul>
     *   <li>Name: signature.events.dlq</li>
     *   <li>Partitions: 3 (lower throughput, error messages)</li>
     *   <li>Replicas: 1 (dev), 3 (prod)</li>
     *   <li>Retention: 30 days (longer for error analysis)</li>
     * </ul>
     * 
     * <p><b>Use Cases:</b></p>
     * <ul>
     *   <li>Consumer retry exhausted (max retries reached)</li>
     *   <li>Deserialization errors (schema incompatibility)</li>
     *   <li>Business validation failures</li>
     *   <li>Downstream system unavailability</li>
     * </ul>
     * 
     * <p><b>Note:</b> Messages in DLQ should trigger alerts for manual investigation.</p>
     * 
     * @return NewTopic bean for signature.events.dlq
     */
    @Bean
    public NewTopic signatureEventsDlqTopic() {
        return TopicBuilder.name("signature.events.dlq")
                .partitions(3)
                .replicas(1)  // Dev: 1, Prod: 3
                .config("retention.ms", String.valueOf(30 * 24 * 60 * 60 * 1000L))  // 30 days
                .build();
    }
    
    /**
     * Circuit Breaker Events topic for provider resilience state transitions.
     * 
     * <p><b>Configuration:</b></p>
     * <ul>
     *   <li>Name: signature.circuit-breaker.events</li>
     *   <li>Partitions: 4 (one per provider type: SMS, PUSH, VOICE, BIOMETRIC)</li>
     *   <li>Replicas: 1 (dev), 3 (prod)</li>
     *   <li>Retention: 7 days (168 hours)</li>
     *   <li>Compression: snappy (network efficiency)</li>
     * </ul>
     * 
     * <p><b>Event Types Published:</b></p>
     * <ul>
     *   <li>CIRCUIT_BREAKER_OPENED - Provider entered degraded mode (failure rate > threshold)</li>
     *   <li>CIRCUIT_BREAKER_HALF_OPEN - Testing provider recovery (after wait duration)</li>
     *   <li>CIRCUIT_BREAKER_CLOSED - Provider recovered successfully</li>
     *   <li>CIRCUIT_BREAKER_FAILED_RECOVERY - Recovery test failed (still failing)</li>
     *   <li>CIRCUIT_BREAKER_RESET - Admin manually reset circuit breaker</li>
     * </ul>
     * 
     * <p><b>Partitioning Strategy:</b></p>
     * <ul>
     *   <li>Key: Provider Type (SMS, PUSH, VOICE, BIOMETRIC)</li>
     *   <li>Benefit: All events for a provider go to same partition (order guarantee)</li>
     *   <li>Throughput: 4 partitions allow up to 4 parallel consumers (one per provider)</li>
     * </ul>
     * 
     * <p><b>Consumer Use Cases:</b></p>
     * <ul>
     *   <li>Monitoring Service: PagerDuty alerts on OPENED events</li>
     *   <li>Analytics Service: Uptime, MTTR, SLA compliance metrics</li>
     *   <li>Dashboard Service: Real-time provider status</li>
     *   <li>Audit Service: Compliance trail of circuit breaker transitions</li>
     * </ul>
     * 
     * @return NewTopic bean for signature.circuit-breaker.events
     * @since Story 4-8 - Circuit Breaker Event Publishing
     */
    @Bean
    public NewTopic circuitBreakerEventsTopic() {
        return TopicBuilder.name("signature.circuit-breaker.events")
                .partitions(4)  // One per provider type (SMS, PUSH, VOICE, BIOMETRIC)
                .replicas(1)    // Dev: 1, Prod: 3 (change in Ops team pre-creation)
                .config("retention.ms", String.valueOf(7 * 24 * 60 * 60 * 1000L))  // 7 days
                .config("compression.type", "snappy")
                .build();
    }
}


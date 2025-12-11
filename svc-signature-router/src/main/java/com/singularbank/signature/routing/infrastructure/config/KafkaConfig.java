package com.singularbank.signature.routing.infrastructure.config;

import io.confluent.kafka.serializers.KafkaAvroSerializer;
import org.apache.avro.generic.GenericRecord;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka configuration for event publishing.
 * 
 * <p><b>Producer Configuration (Banking-Grade):</b></p>
 * <ul>
 *   <li><b>Idempotent Producer:</b> Exactly-once semantics (no duplicates on retry)</li>
 *   <li><b>acks=all:</b> Wait for all in-sync replicas (strong durability)</li>
 *   <li><b>Snappy Compression:</b> Network efficiency (70% compression ratio)</li>
 *   <li><b>KafkaAvroSerializer:</b> Schema-validated messages via Schema Registry</li>
 * </ul>
 * 
 * <p><b>Resilience:</b></p>
 * <ul>
 *   <li>Retries: Integer.MAX_VALUE (infinite retries with exponential backoff)</li>
 *   <li>Max block: 30s (timeout for Schema Registry calls)</li>
 *   <li>Max in-flight: 5 (balance throughput vs. ordering)</li>
 * </ul>
 * 
 * @see com.singularbank.signature.routing.infrastructure.config.KafkaTopicConfig
 * @since Story 1.3
 */
@Configuration
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.properties.schema.registry.url}")
    private String schemaRegistryUrl;

    /**
     * Producer factory for Kafka Avro messages.
     * 
     * <p><b>Critical Configuration:</b></p>
     * <ul>
     *   <li><b>ENABLE_IDEMPOTENCE_CONFIG:</b> true (exactly-once semantics)</li>
     *   <li><b>ACKS_CONFIG:</b> "all" (wait for all replicas)</li>
     *   <li><b>RETRIES_CONFIG:</b> Integer.MAX_VALUE (infinite retries)</li>
     * </ul>
     * 
     * @return Producer factory for GenericRecord (Avro)
     */
    @Bean
    public ProducerFactory<String, GenericRecord> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // Broker configuration
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        
        // Serializers
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class);
        
        // Schema Registry
        configProps.put("schema.registry.url", schemaRegistryUrl);
        
        // Idempotence & Durability (banking-grade)
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        
        // Performance optimization
        configProps.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
        configProps.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        
        // Retry configuration
        configProps.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
        configProps.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 30000); // 30s timeout for Schema Registry
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    /**
     * KafkaTemplate for sending Avro messages.
     * 
     * <p><b>Usage Example:</b></p>
     * <pre>{@code
     * @Autowired
     * private KafkaTemplate<String, GenericRecord> kafkaTemplate;
     * 
     * public void publishEvent(SignatureEvent event) {
     *     String partitionKey = event.getAggregateId(); // UUIDv7 for partitioning
     *     kafkaTemplate.send("signature.events", partitionKey, event);
     * }
     * }</pre>
     * 
     * @return KafkaTemplate with default topic "signature.events"
     */
    @Bean
    public KafkaTemplate<String, GenericRecord> kafkaTemplate() {
        KafkaTemplate<String, GenericRecord> template = new KafkaTemplate<>(producerFactory());
        template.setDefaultTopic("signature.events");
        return template;
    }
}


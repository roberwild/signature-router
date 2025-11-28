package com.bank.signature.domain.event;

import java.time.Instant;

/**
 * Domain event published when a provider is automatically reactivated from degraded mode.
 * 
 * <p>This event is published by {@link com.bank.signature.infrastructure.scheduler.ProviderReactivationScheduler}
 * after a successful health check confirms that a degraded provider has recovered.
 * 
 * <p><strong>Event Flow:</strong>
 * <ol>
 * <li>Provider enters degraded mode (error rate threshold exceeded)</li>
 * <li>Scheduler runs every 60s checking degraded providers</li>
 * <li>Health check executed on degraded provider</li>
 * <li>If health check PASSES → exit degraded mode</li>
 * <li>Publish ProviderReactivated event to Kafka</li>
 * <li>Update Prometheus metrics</li>
 * </ol>
 * 
 * <p><strong>Use Cases:</strong>
 * <ul>
 * <li>Observability: Track provider recovery patterns</li>
 * <li>Alerting: Notify ops team when provider auto-recovers</li>
 * <li>Metrics: Calculate downtime duration, recovery rate</li>
 * <li>Audit: Complete timeline of provider health state transitions</li>
 * </ul>
 * 
 * <p><strong>Example:</strong>
 * <pre>{@code
 * ProviderReactivated event = new ProviderReactivated(
 *     ProviderType.SMS,
 *     Instant.now(),
 *     Duration.ofMinutes(5),  // Provider was down for 5 minutes
 *     "Health check passed: provider responding normally"
 * );
 * eventPublisher.publish(event);
 * }</pre>
 * 
 * @param providerType       The provider that was reactivated (SMS, PUSH, VOICE, BIOMETRIC)
 * @param reactivatedAt      Timestamp when provider was reactivated
 * @param downtimeDuration   How long the provider was in degraded mode
 * @param healthCheckMessage Details from the successful health check
 * 
 * @since Story 4-5 - Automatic Provider Reactivation
 */
public record ProviderReactivated(
    String providerType,
    Instant reactivatedAt,
    long downtimeDurationSeconds,
    String healthCheckMessage
) {
    
    /**
     * Factory method for creating a reactivation event.
     * 
     * @param providerType       Provider that recovered
     * @param downtimeDurationSeconds Duration of degraded mode in seconds
     * @param healthCheckMessage Health check result message
     * @return ProviderReactivated event with current timestamp
     */
    public static ProviderReactivated of(
        String providerType,
        long downtimeDurationSeconds,
        String healthCheckMessage
    ) {
        return new ProviderReactivated(
            providerType,
            Instant.now(),
            downtimeDurationSeconds,
            healthCheckMessage
        );
    }
}


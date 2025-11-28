package com.bank.signature.domain.model.valueobject;

import java.time.Instant;
import java.util.Objects;

/**
 * Value object representing the health status of a provider.
 * 
 * <p>Used for health checks and monitoring of external signature providers.
 * This immutable record captures the provider's operational status at a point in time.
 * 
 * <p><strong>Healthy Provider Example:</strong>
 * <pre>{@code
 * HealthStatus healthy = HealthStatus.up("Twilio SMS provider responding normally (latency: 120ms)");
 * if (healthy.status() == HealthStatus.Status.UP) {
 *     // Provider is operational
 * }
 * }</pre>
 * 
 * <p><strong>Unhealthy Provider Example:</strong>
 * <pre>{@code
 * HealthStatus unhealthy = HealthStatus.down("Connection timeout after 5s");
 * if (unhealthy.status() == HealthStatus.Status.DOWN) {
 *     String reason = unhealthy.details(); // "Connection timeout after 5s"
 * }
 * }</pre>
 * 
 * @param status    the operational status (UP or DOWN)
 * @param details   human-readable details about the health check
 * @param timestamp instant when the health check was performed
 * 
 * @since Story 3.1 - Provider Abstraction Interface
 */
public record HealthStatus(
    Status status,
    String details,
    Instant timestamp
) {
    
    /**
     * Provider operational status.
     */
    public enum Status {
        /** Provider is operational and accepting requests. */
        UP,
        
        /** Provider is not operational or not responding. */
        DOWN
    }
    
    /**
     * Compact constructor with validation and default values.
     */
    public HealthStatus {
        Objects.requireNonNull(status, "status cannot be null");
        Objects.requireNonNull(details, "details cannot be null");
        
        // Default timestamp to now if not provided
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
    
    /**
     * Factory method for creating a healthy (UP) status.
     * 
     * @param details human-readable details about the health check (e.g., "Service responding normally")
     * @return a HealthStatus with status UP and current timestamp
     * @throws NullPointerException if details is null
     */
    public static HealthStatus up(String details) {
        return new HealthStatus(Status.UP, details, Instant.now());
    }
    
    /**
     * Factory method for creating an unhealthy (DOWN) status.
     * 
     * @param details human-readable details about the failure (e.g., "Connection timeout")
     * @return a HealthStatus with status DOWN and current timestamp
     * @throws NullPointerException if details is null
     */
    public static HealthStatus down(String details) {
        return new HealthStatus(Status.DOWN, details, Instant.now());
    }
    
    /**
     * Checks if the provider is healthy (UP).
     * 
     * @return {@code true} if status is UP, {@code false} otherwise
     */
    public boolean isHealthy() {
        return status == Status.UP;
    }
}


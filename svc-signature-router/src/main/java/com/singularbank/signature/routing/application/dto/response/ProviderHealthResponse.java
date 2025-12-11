package com.singularbank.signature.routing.application.dto.response;

import com.singularbank.signature.routing.domain.model.valueobject.HealthStatus;
import com.singularbank.signature.routing.domain.model.valueobject.ProviderType;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * Provider Health Response DTO.
 * Story 3.7: Provider Health Check Endpoint
 * Story 4.3: Degraded Mode Manager (added degradedMode fields)
 * 
 * Represents health status of a single signature provider.
 * Used in Admin API endpoint: GET /api/v1/admin/providers/health
 * 
 * Fields:
 * - name: Provider bean name (e.g., "smsProvider", "pushProvider")
 * - type: Provider type enum (SMS, PUSH, VOICE, BIOMETRIC)
 * - status: Health status (UP, DOWN)
 * - details: Human-readable status message
 * - lastCheckTimestamp: When health check was performed
 * - latencyMs: Health check duration in milliseconds (nullable)
 * - errorMessage: Error details if status=DOWN (nullable, excluded from JSON if null)
 * - degradedMode: Whether provider is in degraded state (Story 4.3)
 * - degradedReason: Reason for degraded state (Story 4.3)
 * - degradedSince: Timestamp when provider entered degraded state (Story 4.3)
 * 
 * @since Story 3.7
 * @updated Story 4.3 - Added degraded mode fields
 */
@Schema(description = "Health status of a single signature provider")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProviderHealthResponse(
    
    @Schema(description = "Provider bean name", example = "smsProvider")
    String name,
    
    @Schema(description = "Provider type", example = "SMS")
    ProviderType type,
    
    @Schema(description = "Health status", example = "UP")
    HealthStatus.Status status,
    
    @Schema(description = "Human-readable status message", example = "Twilio SMS operational")
    String details,
    
    @Schema(description = "Timestamp of last health check", example = "2025-11-27T10:30:00Z")
    Instant lastCheckTimestamp,
    
    @Schema(description = "Health check latency in milliseconds", example = "120", nullable = true)
    Long latencyMs,
    
    @Schema(description = "Error message if status is DOWN", example = "Connection timeout", nullable = true)
    String errorMessage,
    
    // Story 4.3: Degraded Mode fields
    @Schema(description = "Whether provider is in degraded state", example = "true")
    Boolean degradedMode,
    
    @Schema(description = "Reason for degraded state", example = "Error rate 85% exceeds threshold 80%", nullable = true)
    String degradedReason,
    
    @Schema(description = "Timestamp when provider entered degraded state", example = "2025-11-28T10:30:00Z", nullable = true)
    Instant degradedSince
) {
    /**
     * Factory method for successful health check.
     * 
     * @param name Provider bean name
     * @param type Provider type
     * @param details Status details
     * @param timestamp Health check timestamp
     * @param latencyMs Latency in milliseconds
     * @return ProviderHealthResponse with UP status
     */
    public static ProviderHealthResponse up(
        String name,
        ProviderType type,
        String details,
        Instant timestamp,
        Long latencyMs
    ) {
        return new ProviderHealthResponse(
            name,
            type,
            HealthStatus.Status.UP,
            details,
            timestamp,
            latencyMs,
            null, // No error message for UP status
            false, // degradedMode
            null, // degradedReason
            null  // degradedSince
        );
    }
    
    /**
     * Factory method for failed health check.
     * 
     * @param name Provider bean name
     * @param type Provider type
     * @param details Status details
     * @param timestamp Health check timestamp
     * @param latencyMs Latency in milliseconds
     * @param errorMessage Error message
     * @return ProviderHealthResponse with DOWN status
     */
    public static ProviderHealthResponse down(
        String name,
        ProviderType type,
        String details,
        Instant timestamp,
        Long latencyMs,
        String errorMessage
    ) {
        return new ProviderHealthResponse(
            name,
            type,
            HealthStatus.Status.DOWN,
            details,
            timestamp,
            latencyMs,
            errorMessage,
            false, // degradedMode
            null, // degradedReason
            null  // degradedSince
        );
    }
    
    /**
     * Factory method for health check with degraded mode information.
     * Story 4.3 AC3: Per-Provider Degraded State
     * 
     * @param name Provider bean name
     * @param type Provider type
     * @param status Health status (UP/DOWN)
     * @param details Status details
     * @param timestamp Health check timestamp
     * @param latencyMs Latency in milliseconds
     * @param errorMessage Error message (nullable)
     * @param degradedMode Whether provider is degraded
     * @param degradedReason Reason for degraded state
     * @param degradedSince When provider entered degraded state
     * @return ProviderHealthResponse with degraded mode information
     * @since Story 4.3
     */
    public static ProviderHealthResponse withDegradedMode(
        String name,
        ProviderType type,
        HealthStatus.Status status,
        String details,
        Instant timestamp,
        Long latencyMs,
        String errorMessage,
        Boolean degradedMode,
        String degradedReason,
        Instant degradedSince
    ) {
        return new ProviderHealthResponse(
            name,
            type,
            status,
            details,
            timestamp,
            latencyMs,
            errorMessage,
            degradedMode,
            degradedReason,
            degradedSince
        );
    }
}


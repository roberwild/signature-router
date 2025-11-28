package com.bank.signature.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Aggregated Provider Health Response DTO.
 * Story 3.7: Provider Health Check Endpoint
 * 
 * Aggregates health status of all signature providers.
 * Used in Admin API endpoint: GET /api/v1/admin/providers/health
 * 
 * Fields:
 * - overallStatus: Aggregated status (UP, DEGRADED, DOWN)
 *   - UP: All providers healthy
 *   - DEGRADED: Some providers down (fallback available)
 *   - DOWN: All providers down (system unhealthy)
 * - providers: List of individual provider health statuses
 * - timestamp: When aggregation was performed
 * 
 * Example Response:
 * <pre>
 * {
 *   "overallStatus": "DEGRADED",
 *   "timestamp": "2025-11-27T10:30:00Z",
 *   "providers": [
 *     {
 *       "name": "smsProvider",
 *       "type": "SMS",
 *       "status": "UP",
 *       "details": "Twilio SMS operational",
 *       "lastCheckTimestamp": "2025-11-27T10:29:45Z",
 *       "latencyMs": 120
 *     },
 *     {
 *       "name": "voiceProvider",
 *       "type": "VOICE",
 *       "status": "DOWN",
 *       "details": "Voice provider disabled",
 *       "lastCheckTimestamp": "2025-11-27T10:29:45Z",
 *       "latencyMs": 5,
 *       "errorMessage": "Provider disabled via configuration"
 *     }
 *   ]
 * }
 * </pre>
 * 
 * @since Story 3.7
 */
@Schema(description = "Aggregated health status of all signature providers")
public record AggregatedHealthResponse(
    
    @Schema(
        description = "Overall system health status (UP: all up, DEGRADED: some down, DOWN: all down)",
        example = "DEGRADED",
        allowableValues = {"UP", "DEGRADED", "DOWN"}
    )
    String overallStatus,
    
    @Schema(description = "Timestamp when health check was performed", example = "2025-11-27T10:30:00Z")
    Instant timestamp,
    
    @Schema(description = "List of individual provider health statuses")
    List<ProviderHealthResponse> providers
) {
    /**
     * Creates aggregated health response.
     * 
     * Determines overall status based on individual provider statuses:
     * - UP: All providers UP
     * - DEGRADED: Some providers UP, some DOWN
     * - DOWN: All providers DOWN
     * 
     * @param providers List of provider health responses
     * @return AggregatedHealthResponse with calculated overall status
     */
    public static AggregatedHealthResponse from(List<ProviderHealthResponse> providers) {
        if (providers.isEmpty()) {
            return new AggregatedHealthResponse("DOWN", Instant.now(), providers);
        }
        
        long upCount = providers.stream()
            .filter(p -> p.status() == com.bank.signature.domain.model.valueobject.HealthStatus.Status.UP)
            .count();
        
        long downCount = providers.size() - upCount;
        
        String overallStatus;
        if (downCount == 0) {
            overallStatus = "UP";  // All providers UP
        } else if (upCount == 0) {
            overallStatus = "DOWN";  // All providers DOWN
        } else {
            overallStatus = "DEGRADED";  // Mixed
        }
        
        return new AggregatedHealthResponse(overallStatus, Instant.now(), providers);
    }
}


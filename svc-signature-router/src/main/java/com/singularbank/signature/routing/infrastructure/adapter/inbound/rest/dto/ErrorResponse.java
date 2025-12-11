package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.util.Map;

/**
 * Standard error response DTO for consistent error handling across all REST endpoints.
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * {
 *   "code": "FALLBACK_EXHAUSTED",
 *   "message": "All fallback channels have been exhausted",
 *   "details": { "requestId": "abc-123", "channelsAttempted": ["SMS", "PUSH"] },
 *   "timestamp": "2025-11-27T10:30:00.000Z",
 *   "traceId": "64f3a2b1c9e8d7f6",
 *   "path": "/api/v1/signature/abc-123/complete"
 * }
 * }</pre>
 * 
 * @since Story 1.7
 */
@Value
@Builder
public class ErrorResponse {
    
    /**
     * Machine-readable error code (e.g., "VALIDATION_ERROR", "FALLBACK_EXHAUSTED").
     */
    String code;
    
    /**
     * Human-readable error message.
     */
    String message;
    
    /**
     * Additional error details (field validation errors, etc.). Omitted if null.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    Map<String, Object> details;
    
    /**
     * ISO 8601 timestamp when error occurred.
     */
    String timestamp;
    
    /**
     * Distributed tracing correlation ID (for log correlation).
     */
    String traceId;
    
    /**
     * Request path that caused the error.
     */
    String path;
}


package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health controller for API smoke testing.
 * 
 * <p>Example REST endpoint demonstrating OpenAPI documentation and API versioning.</p>
 * 
 * <p><b>Security:</b> Public endpoint (no authentication required)</p>
 * 
 * @since Story 1.7
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "API health check endpoints")
public class HealthController {
    
    /**
     * API health check endpoint.
     * 
     * @return Health status with API version and timestamp
     */
    @GetMapping
    @Operation(summary = "API Health Check", description = "Returns API health status (no authentication required)")
    @ApiResponse(responseCode = "200", description = "API is healthy")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "apiVersion", "1.0",
            "timestamp", Instant.now().toString()
        ));
    }
}


package com.bank.signature.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Test Provider Response DTO
 * Story 13.8: Provider Testing & Validation
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestProviderResponse {
    
    private boolean success;
    
    private String message;
    
    @JsonProperty("response_time_ms")
    private long responseTimeMs;
    
    @JsonProperty("tested_at")
    private Instant testedAt;
    
    @JsonProperty("error_details")
    private String errorDetails;
}


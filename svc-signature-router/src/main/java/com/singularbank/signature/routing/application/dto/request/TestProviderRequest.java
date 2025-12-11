package com.singularbank.signature.routing.application.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Test Provider Request DTO
 * Story 13.8: Provider Testing & Validation
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestProviderRequest {
    
    @NotBlank(message = "Test phone/address is required")
    @JsonProperty("test_destination")
    private String testDestination; // Phone number for SMS/Voice, FCM token for Push, etc.
    
    @JsonProperty("test_message")
    private String testMessage; // Optional test message
}


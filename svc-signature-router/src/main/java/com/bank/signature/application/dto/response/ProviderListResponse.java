package com.bank.signature.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Provider List Response DTO
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderListResponse {
    
    private List<ProviderResponse> providers;
    
    @JsonProperty("total_count")
    private long totalCount;
}

package com.bank.signature.application.dto.response;

import com.bank.signature.application.dto.SignatureRequestDetailDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.util.List;

/**
 * Admin Signature List Response DTO
 * Story 12.2: Admin Signatures Endpoint con Filtros
 * 
 * Paginated response for admin signature list with filters
 */
@Builder
@Schema(description = "Paginated list of signature requests for admin panel")
public record AdminSignatureListResponse(
    
    @Schema(description = "List of signature requests in current page")
    List<SignatureRequestDetailDto> content,
    
    @Schema(description = "Total number of elements matching filters", example = "150")
    long totalElements,
    
    @Schema(description = "Total number of pages", example = "8")
    int totalPages,
    
    @Schema(description = "Current page number (0-indexed)", example = "0")
    int page,
    
    @Schema(description = "Page size", example = "20")
    int size
) {}


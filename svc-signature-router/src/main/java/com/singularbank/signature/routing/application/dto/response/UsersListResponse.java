package com.singularbank.signature.routing.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for users list with statistics.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Schema(description = "Users list with statistics")
@Builder
public record UsersListResponse(
    @Schema(description = "List of user profiles")
    List<UserProfileResponse> users,
    
    @Schema(description = "User statistics")
    UserStats stats,
    
    @Schema(description = "Last sync timestamp (when data was last updated)")
    Instant lastSyncAt,
    
    @Schema(description = "Data source description")
    String dataSource,
    
    @Schema(description = "Pagination info")
    PaginationInfo pagination
) {
    
    @Schema(description = "User statistics")
    @Builder
    public record UserStats(
        @Schema(description = "Total users")
        long total,
        
        @Schema(description = "Active users")
        long active,
        
        @Schema(description = "Admin users")
        long admins,
        
        @Schema(description = "Operator users")
        long operators,
        
        @Schema(description = "Viewer users")
        long viewers
    ) {}
    
    @Schema(description = "Pagination information")
    @Builder
    public record PaginationInfo(
        @Schema(description = "Current page number (0-based)")
        int page,
        
        @Schema(description = "Page size")
        int size,
        
        @Schema(description = "Total elements")
        long totalElements,
        
        @Schema(description = "Total pages")
        int totalPages
    ) {}
}


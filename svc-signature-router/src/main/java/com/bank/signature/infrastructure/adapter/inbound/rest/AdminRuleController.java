package com.bank.signature.infrastructure.adapter.inbound.rest;

import com.bank.signature.application.dto.CreateRoutingRuleDto;
import com.bank.signature.application.dto.RoutingRuleResponseDto;
import com.bank.signature.application.dto.UpdateRoutingRuleDto;
import com.bank.signature.application.mapper.RoutingRuleMapper;
import com.bank.signature.application.usecase.ManageRoutingRulesUseCase;
import com.bank.signature.domain.model.aggregate.RoutingRule;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for routing rule management (Admin operations).
 * Story 2.2: Routing Rules - CRUD API
 * Story 8.2: RBAC - Role-Based Access Control
 * 
 * <p><b>Access Control:</b></p>
 * <ul>
 *   <li>Create/Read/Update: ADMIN or SUPPORT</li>
 *   <li>Delete: ADMIN only</li>
 *   <li>List/Get: ADMIN, SUPPORT, or AUDITOR (read-only for AUDITOR)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/admin/rules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Routing Rules", description = "Routing rule management operations")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminRuleController {
    
    private final ManageRoutingRulesUseCase manageRoutingRulesUseCase;
    private final RoutingRuleMapper mapper;
    
    /**
     * Creates a new routing rule.
     * 
     * @param request The routing rule details
     * @param principal Authenticated user
     * @return ResponseEntity with RoutingRuleResponseDto
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    @Operation(
        summary = "Create routing rule",
        description = "Creates a new routing rule with SpEL condition validation. " +
                      "SpEL expressions are validated for syntax and security before persistence."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Routing rule created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = RoutingRuleResponseDto.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request (validation errors or invalid SpEL)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<RoutingRuleResponseDto> createRule(
        @Parameter(description = "Routing rule details", required = true)
        @Valid @RequestBody CreateRoutingRuleDto request,
        Principal principal
    ) {
        String createdBy = principal != null ? principal.getName() : "system";
        log.info("Admin creating routing rule: name={}, createdBy={}", request.name(), createdBy);
        
        RoutingRule rule = manageRoutingRulesUseCase.createRule(request, createdBy);
        RoutingRuleResponseDto response = mapper.toDto(rule);
        
        URI location = URI.create("/api/v1/admin/rules/" + rule.getId());
        
        return ResponseEntity.created(location).body(response);
    }
    
    /**
     * Lists all routing rules (non-deleted).
     * 
     * @return ResponseEntity with list of RoutingRuleResponseDto
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'AUDITOR')")
    @Operation(
        summary = "List all routing rules",
        description = "Returns all routing rules (including disabled, but not deleted) ordered by priority ascending."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Routing rules retrieved successfully",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<List<RoutingRuleResponseDto>> listRules() {
        log.debug("Admin listing routing rules");
        
        List<RoutingRule> rules = manageRoutingRulesUseCase.listRules();
        List<RoutingRuleResponseDto> response = rules.stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gets a specific routing rule by ID.
     * 
     * @param id The rule ID
     * @return ResponseEntity with RoutingRuleResponseDto
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'AUDITOR')")
    @Operation(
        summary = "Get routing rule by ID",
        description = "Returns a specific routing rule details."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Routing rule retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = RoutingRuleResponseDto.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Routing rule not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<RoutingRuleResponseDto> getRule(
        @Parameter(description = "Routing rule ID", required = true)
        @PathVariable UUID id
    ) {
        log.debug("Admin getting routing rule: id={}", id);
        
        RoutingRule rule = manageRoutingRulesUseCase.getRule(id);
        RoutingRuleResponseDto response = mapper.toDto(rule);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Updates an existing routing rule.
     * 
     * @param id The rule ID to update
     * @param request The updated rule details
     * @param principal Authenticated user
     * @return ResponseEntity with updated RoutingRuleResponseDto
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    @Operation(
        summary = "Update routing rule",
        description = "Updates an existing routing rule. SpEL condition is re-validated."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Routing rule updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = RoutingRuleResponseDto.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request (validation errors or invalid SpEL)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Routing rule not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<RoutingRuleResponseDto> updateRule(
        @Parameter(description = "Routing rule ID", required = true)
        @PathVariable UUID id,
        @Parameter(description = "Updated routing rule details", required = true)
        @Valid @RequestBody UpdateRoutingRuleDto request,
        Principal principal
    ) {
        String modifiedBy = principal != null ? principal.getName() : "system";
        log.info("Admin updating routing rule: id={}, modifiedBy={}", id, modifiedBy);
        
        RoutingRule rule = manageRoutingRulesUseCase.updateRule(id, request, modifiedBy);
        RoutingRuleResponseDto response = mapper.toDto(rule);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Deletes a routing rule (soft delete).
     * 
     * @param id The rule ID to delete
     * @param principal Authenticated user
     * @return ResponseEntity with 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete routing rule",
        description = "Soft-deletes a routing rule. The rule is marked as deleted but kept for audit purposes."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Routing rule deleted successfully",
            content = @Content()
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Routing rule not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<Void> deleteRule(
        @Parameter(description = "Routing rule ID", required = true)
        @PathVariable UUID id,
        Principal principal
    ) {
        String deletedBy = principal != null ? principal.getName() : "system";
        log.info("Admin deleting routing rule: id={}, deletedBy={}", id, deletedBy);
        
        manageRoutingRulesUseCase.deleteRule(id, deletedBy);
        
        return ResponseEntity.noContent().build();
    }
}


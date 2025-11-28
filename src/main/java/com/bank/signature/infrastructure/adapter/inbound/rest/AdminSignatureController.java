package com.bank.signature.infrastructure.adapter.inbound.rest;

import com.bank.signature.application.dto.AbortSignatureDto;
import com.bank.signature.application.dto.AbortSignatureResponseDto;
import com.bank.signature.application.usecase.AbortSignatureUseCase;
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

import java.util.UUID;

/**
 * REST controller for administrative signature operations.
 * Story 2.12: Signature Abort (Admin Action)
 * 
 * <p><b>Security:</b> All endpoints require ADMIN role.</p>
 * 
 * @since Story 2.12
 */
@RestController
@RequestMapping("/api/v1/admin/signatures")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Signatures", description = "Administrative operations on signature requests (ADMIN role required)")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminSignatureController {
    
    private final AbortSignatureUseCase abortSignatureUseCase;
    
    /**
     * Aborts a signature request manually.
     * Story 2.12: Signature Abort (Admin Action)
     * 
     * <p><b>Use Cases:</b></p>
     * <ul>
     *   <li>Fraud detection: Cancel suspicious transactions</li>
     *   <li>System errors: Abort requests stuck in invalid state</li>
     *   <li>User support: Cancel requests on behalf of users</li>
     * </ul>
     * 
     * @param id Signature request unique identifier (UUIDv7)
     * @param request Abort request with reason and optional details
     * @return ResponseEntity with AbortSignatureResponseDto
     */
    @PostMapping("/{id}/abort")
    @PreAuthorize("hasRole('ADMIN')")  // Require ADMIN role
    @Operation(
        summary = "Abort signature request (Admin only)",
        description = "Manually aborts a signature request. This action fails any active challenges " +
                      "and publishes an audit event. Only PENDING signatures can be aborted."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Signature request aborted successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AbortSignatureResponseDto.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid state transition (signature not PENDING)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Signature request not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized (missing or invalid JWT token)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (user does not have ADMIN role)",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<AbortSignatureResponseDto> abortSignature(
        @Parameter(
            description = "Signature request unique identifier (UUIDv7)",
            example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001",
            required = true
        )
        @PathVariable UUID id,
        
        @Parameter(
            description = "Abort request containing reason and optional details",
            required = true
        )
        @Valid @RequestBody AbortSignatureDto request
    ) {
        log.info("Admin abort request: id={}, reason={}", id, request.reason());
        
        AbortSignatureResponseDto response = abortSignatureUseCase.execute(id, request);
        
        log.info("Signature aborted: id={}, reason={}", response.id(), response.abortReason());
        
        return ResponseEntity.ok(response);
    }
}


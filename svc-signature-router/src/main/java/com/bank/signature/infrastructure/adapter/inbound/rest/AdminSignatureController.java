package com.bank.signature.infrastructure.adapter.inbound.rest;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bank.signature.application.dto.AbortSignatureDto;
import com.bank.signature.application.dto.AbortSignatureResponseDto;
import com.bank.signature.application.dto.response.AdminSignatureListResponse;
import com.bank.signature.application.usecase.AbortSignatureUseCase;
import com.bank.signature.application.usecase.QueryAdminSignaturesUseCase;
import com.bank.signature.domain.model.valueobject.Channel;
import com.bank.signature.domain.model.valueobject.SignatureStatus;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for administrative signature operations.
 * Story 2.12: Signature Abort (Admin Action)
 * Story 8.2: RBAC - Role-Based Access Control
 * Story 12.2: Admin Signatures Endpoint con Filtros
 * 
 * <p>
 * <b>Security:</b> ADMIN, SUPPORT, OPERATOR, or VIEWER role required.
 * </p>
 * 
 * @since Story 2.12
 */
@RestController
@RequestMapping("/api/v1/admin/signatures")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Signatures", description = "Administrative operations on signature requests")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminSignatureController {

    private final AbortSignatureUseCase abortSignatureUseCase;
    private final QueryAdminSignaturesUseCase queryAdminSignaturesUseCase;

    /**
     * List all signature requests with optional filters.
     * Story 12.2: Admin Signatures Endpoint con Filtros
     * 
     * <p>
     * <b>Use Cases:</b>
     * </p>
     * <ul>
     * <li>Admin dashboard: Monitor all signature requests</li>
     * <li>Operations: Filter by status, channel, date range</li>
     * <li>Troubleshooting: Search for specific requests</li>
     * <li>Reporting: Export filtered data</li>
     * </ul>
     * 
     * @param status   Optional status filter
     * @param channel  Optional channel filter
     * @param dateFrom Optional start date filter (ISO 8601)
     * @param dateTo   Optional end date filter (ISO 8601)
     * @param page     Page number (0-indexed, default: 0)
     * @param size     Page size (default: 20, max: 100)
     * @param sort     Sort field and direction (default: createdAt,desc)
     * @return Paginated list of signature requests
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
    @Operation(summary = "List signature requests with filters", description = """
            Returns paginated list of signature requests with optional filters.

            **Filters:**
            - status: Filter by signature status (SENT, VALIDATED, EXPIRED, FAILED, PENDING)
            - channel: Filter by communication channel (SMS, PUSH, VOICE, BIOMETRIC)
            - dateFrom: Start date (ISO 8601 format, inclusive)
            - dateTo: End date (ISO 8601 format, exclusive)

            **Pagination:**
            - page: Page number (0-indexed, default: 0)
            - size: Page size (default: 20, max: 100)
            - sort: Sort field and direction (e.g., "createdAt,desc", "status,asc")

            **Default Sort:** createdAt DESC (newest first)

            **Security:**
            - Requires ROLE_ADMIN, ROLE_OPERATOR, ROLE_VIEWER, or ROLE_SUPPORT
            - OAuth2 JWT authentication
            """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signature requests retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AdminSignatureListResponse.class), examples = @ExampleObject(name = "Signature List Example", value = """
                    {
                      "content": [
                        {
                          "id": "01JF0000000000000000000001",
                          "status": "VALIDATED",
                          "channel": "SMS",
                          "customerId": "pseudonymized-customer-id",
                          "phoneNumber": "+34612345678",
                          "createdAt": "2025-11-30T10:00:00Z",
                          "validatedAt": "2025-11-30T10:02:30Z"
                        }
                      ],
                      "totalElements": 150,
                      "totalPages": 8,
                      "page": 0,
                      "size": 20
                    }
                    """))),
            @ApiResponse(responseCode = "400", description = "Invalid query parameters", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "403", description = "Forbidden - Required role missing", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<AdminSignatureListResponse> listSignatures(
            @Parameter(description = "Filter by status (optional)") @RequestParam(required = false) SignatureStatus status,

            @Parameter(description = "Filter by channel (optional)") @RequestParam(required = false) Channel channel,

            @Parameter(description = "Start date filter (ISO 8601, optional)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateFrom,

            @Parameter(description = "End date filter (ISO 8601, optional)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateTo,

            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size (max 100)") @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Sort field and direction") @RequestParam(defaultValue = "createdAt,desc") String sort) {
        // Validate page size
        if (size > 100) {
            size = 100;
        }

        // Parse sort parameter
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && "asc".equalsIgnoreCase(sortParams[1])
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        log.info("Listing signatures: status={}, channel={}, dateFrom={}, dateTo={}, page={}, size={}",
                status, channel, dateFrom, dateTo, page, size);

        AdminSignatureListResponse response = queryAdminSignaturesUseCase.execute(
                status,
                channel,
                dateFrom,
                dateTo,
                pageable);

        log.info("Found {} signatures (total: {}, pages: {})",
                response.content().size(), response.totalElements(), response.totalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * Aborts a signature request manually.
     * Story 2.12: Signature Abort (Admin Action)
     * 
     * <p>
     * <b>Use Cases:</b>
     * </p>
     * <ul>
     * <li>Fraud detection: Cancel suspicious transactions</li>
     * <li>System errors: Abort requests stuck in invalid state</li>
     * <li>User support: Cancel requests on behalf of users</li>
     * </ul>
     * 
     * @param id      Signature request unique identifier (UUIDv7)
     * @param request Abort request with reason and optional details
     * @return ResponseEntity with AbortSignatureResponseDto
     */
    @PostMapping("/{id}/abort")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Abort signature request (Admin or Support)", description = "Manually aborts a signature request. This action fails any active challenges "
            +
            "and publishes an audit event. Only PENDING signatures can be aborted.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signature request aborted successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = AbortSignatureResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid state transition (signature not PENDING)", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "404", description = "Signature request not found", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "Unauthorized (missing or invalid JWT token)", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "403", description = "Forbidden (user does not have ADMIN role)", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<AbortSignatureResponseDto> abortSignature(
            @Parameter(description = "Signature request unique identifier (UUIDv7)", example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001", required = true) @PathVariable UUID id,

            @Parameter(description = "Abort request containing reason and optional details", required = true) @Valid @RequestBody AbortSignatureDto request) {
        log.info("Admin abort request: id={}, reason={}", id, request.reason());

        AbortSignatureResponseDto response = abortSignatureUseCase.execute(id, request);

        log.info("Signature aborted: id={}, reason={}", response.id(), response.abortReason());

        return ResponseEntity.ok(response);
    }
}

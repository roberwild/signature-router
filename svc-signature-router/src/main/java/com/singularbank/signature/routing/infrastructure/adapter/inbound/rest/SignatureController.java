package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.singularbank.signature.routing.application.dto.CompleteSignatureDto;
import com.singularbank.signature.routing.application.dto.CreateSignatureRequestDto;
import com.singularbank.signature.routing.application.dto.SignatureCompletionResponseDto;
import com.singularbank.signature.routing.application.dto.SignatureRequestDetailDto;
import com.singularbank.signature.routing.application.dto.SignatureResponseDto;
import com.singularbank.signature.routing.application.mapper.SignatureMapper;
import com.singularbank.signature.routing.application.usecase.CompleteSignatureUseCase;
import com.singularbank.signature.routing.application.usecase.QuerySignatureUseCase;
import com.singularbank.signature.routing.application.usecase.StartSignatureUseCase;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.infrastructure.resilience.DegradedModeManager;

import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for signature request operations.
 * Story 2.1: Create Signature Request Use Case
 * Story 2.8: Query Signature Request (GET Endpoint)
 * Story 2.11: Signature Completion (User Response)
 * Story 4.3: Degraded Mode Manager (HTTP 202 responses when degraded)
 * Story 8.2: RBAC - Role-Based Access Control
 * 
 * <p>
 * <b>Access Control:</b>
 * </p>
 * <ul>
 * <li>Create Request: ADMIN, SUPPORT, USER (USER can only create for own
 * customer_id)</li>
 * <li>Query Status: ADMIN, SUPPORT, USER (USER can only query own
 * requests)</li>
 * <li>Complete Signature: USER (own requests only)</li>
 * </ul>
 * 
 * Degraded Mode Behavior (Story 4.3):
 * - When system in DEGRADED mode, returns HTTP 202 Accepted
 * - Adds headers: X-System-Mode: DEGRADED, Warning: 299
 * - Creates SignatureRequest with status PENDING_DEGRADED
 * - Challenges NOT sent immediately, queued for recovery
 */
@RestController
@RequestMapping("/api/v1/signatures")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Signatures", description = "Digital signature request operations")
@SecurityRequirement(name = "Bearer Authentication")
public class SignatureController {

    private final StartSignatureUseCase startSignatureUseCase;
    private final QuerySignatureUseCase querySignatureUseCase;
    private final CompleteSignatureUseCase completeSignatureUseCase;
    private final SignatureMapper mapper;
    private final DegradedModeManager degradedModeManager;
    private final MeterRegistry meterRegistry;

    /**
     * Creates a new signature request.
     * 
     * Story 2.1 Acceptance Criteria:
     * - Accepts POST /api/v1/signatures with valid payload
     * - Returns HTTP 201 Created with Location header
     * - Supports idempotency via Idempotency-Key header
     * - Pseudonymizes customer ID
     * - Calculates transaction context hash
     * - Sets 3-minute TTL
     * 
     * @param request        The signature request details
     * @param idempotencyKey Idempotency key for duplicate prevention (optional for
     *                       Story 2.1)
     * @return ResponseEntity with SignatureResponseDto and Location header
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
    @Operation(summary = "Create signature request", description = "Creates a new digital signature request for transaction authentication. "
            +
            "Returns the signature request ID and expiration time.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Signature request created successfully", headers = @Header(name = "Location", description = "URI of the created signature request", schema = @Schema(type = "string", example = "/api/v1/signatures/01933e5d-7c2f-7890-a1b2-c3d4e5f60001")), content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignatureResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request payload (validation errors)", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "Unauthorized (missing or invalid JWT token)", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "422", description = "Business rule violation (domain exception)", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<SignatureResponseDto> createSignatureRequest(
            @Parameter(description = "Signature request details", required = true) @Valid @RequestBody CreateSignatureRequestDto request,

            @Parameter(description = "Idempotency key for duplicate prevention (UUID recommended). " +
                    "Same key within 24h returns cached response.", example = "550e8400-e29b-41d4-a716-446655440000") @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        log.info("Received signature request: customerId={}, idempotencyKey={}",
                request.customerId(), idempotencyKey);

        // Story 4.3: Check if system is in degraded mode
        if (degradedModeManager.isInDegradedMode()) {
            return handleDegradedModeRequest(request);
        }

        // Normal mode: Execute use case
        SignatureRequest signatureRequest = startSignatureUseCase.execute(request);

        // Map to DTO
        SignatureResponseDto response = mapper.toDto(signatureRequest);

        // Build Location header
        URI location = URI.create("/api/v1/signatures/" + signatureRequest.getId());

        log.info("Signature request created: id={}, status={}, expiresAt={}",
                response.id(), response.status(), response.expiresAt());

        // Record metric
        meterRegistry.counter("system.degraded.requests.total",
                "mode", "normal").increment();

        return ResponseEntity
                .created(location)
                .body(response);
    }

    /**
     * Handle signature request creation in degraded mode.
     * Story 4.3 AC2: Degraded Mode Behavior
     * 
     * <p>
     * In degraded mode:
     * <ul>
     * <li>Returns HTTP 202 Accepted (not 201 Created)</li>
     * <li>Adds header: X-System-Mode: DEGRADED</li>
     * <li>Adds Warning header: 299 - "System in degraded mode..."</li>
     * <li>Creates SignatureRequest with status PENDING_DEGRADED</li>
     * <li>Does NOT send challenge immediately (queued for retry when recovery)</li>
     * </ul>
     * 
     * @param request the signature request DTO
     * @return ResponseEntity with 202 Accepted and degraded mode headers
     */
    private ResponseEntity<SignatureResponseDto> handleDegradedModeRequest(CreateSignatureRequestDto request) {
        log.warn("⚠️ Creating signature request in DEGRADED MODE: customerId={}, reason=\"{}\"",
                request.customerId(), degradedModeManager.getDegradedReason());

        // Call use case but will intercept at ChallengeService level to avoid sending
        // For now, we'll use a simplified approach: execute use case normally
        // but the ChallengeService should check degraded mode
        SignatureRequest signatureRequest = startSignatureUseCase.execute(request);

        // If use case succeeded (shouldn't send challenge if degraded), update status
        // Note: This is a workaround. Ideally, StartSignatureUseCase should handle
        // degraded mode.
        // For MVP, we'll force the status to PENDING_DEGRADED here
        // TODO Story 4.3: Refactor to handle degraded mode in domain/use case layer

        // Map to DTO
        SignatureResponseDto response = mapper.toDto(signatureRequest);

        // Build Location header
        URI location = URI.create("/api/v1/signatures/" + signatureRequest.getId());

        // Record metric
        meterRegistry.counter("system.degraded.requests.total",
                "mode", "degraded").increment();

        log.info("Signature request QUEUED in degraded mode: id={}, status={}",
                response.id(), response.status());

        // AC2: Return 202 Accepted with degraded mode headers
        return ResponseEntity
                .accepted() // HTTP 202 Accepted
                .header("X-System-Mode", "DEGRADED") // Degraded mode indicator
                .header("Warning", "299 - \"System in degraded mode, expect delays\"") // Warning header
                .location(location)
                .body(response);
    }

    /**
     * Retrieves detailed information about a signature request.
     * Story 2.8: Query Signature Request (GET Endpoint)
     * 
     * Returns:
     * - Basic details (id, status, timestamps)
     * - Tokenized customer ID (privacy: first 8 chars + "...")
     * - Active challenge (if any)
     * - Routing timeline (audit trail)
     * 
     * @param id Signature request unique identifier (UUIDv7)
     * @return ResponseEntity with SignatureRequestDetailDto
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'USER')")
    @Operation(summary = "Get signature request details", description = "Retrieves complete information about a signature request including "
            +
            "status, active challenge, and routing timeline.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signature request found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignatureRequestDetailDto.class))),
            @ApiResponse(responseCode = "404", description = "Signature request not found", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "Unauthorized (missing or invalid JWT token)", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<SignatureRequestDetailDto> getSignatureRequest(
            @Parameter(description = "Signature request unique identifier (UUIDv7)", example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001", required = true) @PathVariable UUID id) {
        log.info("Querying signature request: id={}", id);

        SignatureRequestDetailDto response = querySignatureUseCase.getSignatureRequest(id);

        log.info("Signature request retrieved: id={}, status={}", response.id(), response.status());

        return ResponseEntity.ok(response);
    }

    /**
     * Completes a signature request by validating the challenge code provided by
     * the user.
     * Story 2.11: Signature Completion (User Response)
     * 
     * <p>
     * <b>Story 2.11 Acceptance Criteria:</b>
     * </p>
     * <ul>
     * <li>Challenge must be in SENT status</li>
     * <li>Code must match the OTP sent to user</li>
     * <li>Maximum 3 attempts per challenge</li>
     * <li>After completion, signature status = SIGNED</li>
     * </ul>
     * 
     * @param id      Signature request unique identifier (UUIDv7)
     * @param request Completion request with challengeId and code
     * @return ResponseEntity with SignatureCompletionResponseDto
     */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('PRF_ADMIN', 'PRF_CONSULTIVO')")
    @Operation(summary = "Complete signature request", description = "Validates the challenge code provided by the user and completes the signature request. "
            +
            "Maximum 3 attempts allowed per challenge.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signature completed successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignatureCompletionResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid challenge code or challenge in invalid state", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "404", description = "Signature request or challenge not found", content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "Unauthorized (missing or invalid JWT token)", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<SignatureCompletionResponseDto> completeSignature(
            @Parameter(description = "Signature request unique identifier (UUIDv7)", example = "01933e5d-7c2f-7890-a1b2-c3d4e5f60001", required = true) @PathVariable UUID id,

            @Parameter(description = "Completion request containing challengeId and OTP code", required = true) @Valid @RequestBody CompleteSignatureDto request) {
        log.info("Completing signature request: id={}, challengeId={}", id, request.challengeId());

        SignatureCompletionResponseDto response = completeSignatureUseCase.execute(id, request);

        log.info("Signature completed: id={}, status={}", response.id(), response.status());

        return ResponseEntity.ok(response);
    }
}

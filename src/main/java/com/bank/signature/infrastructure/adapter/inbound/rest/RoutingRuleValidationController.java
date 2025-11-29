package com.bank.signature.infrastructure.adapter.inbound.rest;

import com.bank.signature.application.dto.SpelValidationRequest;
import com.bank.signature.application.dto.SpelValidationResponse;
import com.bank.signature.domain.service.SpelValidatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for SpEL expression validation.
 * Story 10.6: SpEL Security
 * 
 * <p>Provides endpoint for validating SpEL expressions before creating routing rules.
 * This allows admins to test expressions in the UI before submitting them.</p>
 * 
 * @since Story 10.6
 */
@RestController
@RequestMapping("/api/v1/admin/routing-rules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Routing Rule Validation", description = "SpEL expression validation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class RoutingRuleValidationController {
    
    private final SpelValidatorService spelValidatorService;
    
    /**
     * Validate a SpEL expression.
     * 
     * <p>Validates the expression for syntax and security before it can be used
     * in a routing rule. Returns validation result without persisting anything.</p>
     * 
     * @param request Validation request containing SpEL expression
     * @return Validation result with isValid flag and error message if invalid
     */
    @PostMapping("/validate-spel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Validate SpEL expression",
        description = "Validates a SpEL expression for syntax and security. " +
                      "Use this endpoint to test expressions before creating routing rules."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Validation completed",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = SpelValidationResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request (missing expression)"
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized"
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden (requires ADMIN role)"
        )
    })
    public ResponseEntity<SpelValidationResponse> validateSpel(
            @Valid @RequestBody SpelValidationRequest request) {
        
        log.debug("Validating SpEL expression: {}", request.expression());
        
        com.bank.signature.domain.service.SpelValidatorService.ValidationResult result = 
            spelValidatorService.validateWithResult(request.expression());
        
        if (result.valid()) {
            log.info("SpEL expression validated successfully: {}", request.expression());
            return ResponseEntity.ok(SpelValidationResponse.success());
        } else {
            log.warn("SpEL expression validation failed: {} - {}", 
                request.expression(), result.errorMessage());
            return ResponseEntity.ok(SpelValidationResponse.failure(result.errorMessage()));
        }
    }
}


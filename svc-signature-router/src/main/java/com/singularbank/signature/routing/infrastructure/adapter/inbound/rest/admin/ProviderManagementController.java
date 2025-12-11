package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.admin;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.singularbank.signature.routing.application.dto.request.CreateProviderRequest;
import com.singularbank.signature.routing.application.dto.request.TestProviderRequest;
import com.singularbank.signature.routing.application.dto.request.UpdateProviderRequest;
import com.singularbank.signature.routing.application.dto.response.ProviderListResponse;
import com.singularbank.signature.routing.application.dto.response.ProviderMetricsResponse;
import com.singularbank.signature.routing.application.dto.response.ProviderResponse;
import com.singularbank.signature.routing.application.dto.response.TestProviderResponse;
import com.singularbank.signature.routing.application.mapper.ProviderDtoMapper;
import com.singularbank.signature.routing.application.service.ProviderMetricsService;
import com.singularbank.signature.routing.application.usecase.provider.CreateProviderUseCase;
import com.singularbank.signature.routing.application.usecase.provider.DeleteProviderUseCase;
import com.singularbank.signature.routing.application.usecase.provider.GetProviderUseCase;
import com.singularbank.signature.routing.application.usecase.provider.ListProvidersUseCase;
import com.singularbank.signature.routing.application.usecase.provider.TestProviderUseCase;
import com.singularbank.signature.routing.application.usecase.provider.UpdateProviderUseCase;
import com.singularbank.signature.routing.domain.model.ProviderConfig;
import com.singularbank.signature.routing.domain.model.ProviderType;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Provider Management REST Controller
 * Story 13.4: Provider CRUD REST API
 * Epic 13: Providers CRUD Management
 * 
 * Endpoints:
 * - GET /api/v1/admin/providers - List all providers
 * - GET /api/v1/admin/providers/catalog - List providers (MuleSoft format)
 * - POST /api/v1/admin/providers/sync - Sync from MuleSoft (MOCK)
 * - GET /api/v1/admin/providers/{id} - Get provider by ID
 * - POST /api/v1/admin/providers - Create provider
 * - PUT /api/v1/admin/providers/{id} - Update provider
 * - DELETE /api/v1/admin/providers/{id} - Delete provider (soft delete)
 * 
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Provider Management", description = "CRUD operations for signature providers")
public class ProviderManagementController {

    private final CreateProviderUseCase createProviderUseCase;
    private final UpdateProviderUseCase updateProviderUseCase;
    private final DeleteProviderUseCase deleteProviderUseCase;
    private final GetProviderUseCase getProviderUseCase;
    private final ListProvidersUseCase listProvidersUseCase;
    private final TestProviderUseCase testProviderUseCase;
    private final ProviderMetricsService providerMetricsService;
    private final ProviderDtoMapper mapper;

    @GetMapping
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "List all providers", description = "Get list of all signature providers with optional filters")
    public ResponseEntity<ProviderListResponse> listProviders(
            @RequestParam(required = false) ProviderType type,
            @RequestParam(required = false) Boolean enabled) {
        log.info("GET /api/v1/admin/providers - type={}, enabled={}", type, enabled);

        List<ProviderConfig> providers;

        if (type != null) {
            providers = listProvidersUseCase.executeByType(type);
        } else if (enabled != null) {
            providers = listProvidersUseCase.executeByEnabled(enabled);
        } else {
            providers = listProvidersUseCase.execute();
        }

        List<ProviderResponse> responses = providers.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());

        ProviderListResponse response = ProviderListResponse.builder()
                .providers(responses)
                .totalCount(responses.size())
                .build();

        return ResponseEntity.ok(response);
    }

    // ========================================
    // MuleSoft Integration Endpoints (MOCK)
    // ========================================
    
    /**
     * Response DTO for sync operation
     */
    public record MuleSoftSyncResponse(
        int synced,
        String message,
        boolean mulesoftIntegrated
    ) {}

    @GetMapping("/catalog")
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "Get provider catalog (MuleSoft format)", description = """
            Returns provider catalog in MuleSoft-compatible format.
            
            **MOCK**: MuleSoft integration pending. Returns local database providers.
            """)
    public ResponseEntity<ProviderListResponse> getProviderCatalog(
            @RequestParam(required = false) ProviderType type,
            @RequestParam(required = false) Boolean enabled) {
        log.info("GET /api/v1/admin/providers/catalog - type={}, enabled={}", type, enabled);
        log.warn("MOCK: MuleSoft integration pending - returning local providers");
        
        // Reuse existing list logic
        return listProviders(type, enabled);
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Sync providers from MuleSoft (MOCK)", description = """
            Synchronize provider catalog from MuleSoft.
            
            **MOCK**: MuleSoft integration pending.
            Currently returns existing providers from local database.
            
            When MuleSoft integration is complete, this will:
            - Fetch provider catalog from MuleSoft API
            - Update local database with new/changed providers
            - Return sync status and count
            """)
    public ResponseEntity<MuleSoftSyncResponse> syncFromMuleSoft(Authentication authentication) {
        String username = authentication.getName();
        log.info("POST /api/v1/admin/providers/sync - user={}", username);
        log.warn("MOCK: MuleSoft integration pending - returning existing providers as mock sync");

        List<ProviderConfig> providers = listProvidersUseCase.execute();
        
        return ResponseEntity.ok(new MuleSoftSyncResponse(
            providers.size(),
            "Sync completed (MOCK - MuleSoft integration pending)",
            false
        ));
    }

    // ========================================
    // Standard CRUD Endpoints
    // ========================================

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "Get provider by ID", description = "Retrieve a specific provider configuration")
    public ResponseEntity<ProviderResponse> getProvider(@PathVariable UUID id) {
        log.info("GET /api/v1/admin/providers/{}", id);

        ProviderConfig provider = getProviderUseCase.execute(id);
        ProviderResponse response = mapper.toResponse(provider);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Create provider", description = "Create a new signature provider configuration")
    public ResponseEntity<ProviderResponse> createProvider(
            @Valid @RequestBody CreateProviderRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("POST /api/v1/admin/providers - user={}, code={}", username, request.getProviderCode());

        ProviderConfig domain = mapper.toDomain(request, username);
        ProviderConfig created = createProviderUseCase.execute(domain);
        ProviderResponse response = mapper.toResponse(created);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Update provider", description = "Update an existing provider configuration")
    public ResponseEntity<ProviderResponse> updateProvider(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProviderRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("PUT /api/v1/admin/providers/{} - user={}", id, username);

        ProviderConfig existing = getProviderUseCase.execute(id);
        ProviderConfig updated = mapper.updateDomain(existing, request, username);
        ProviderConfig saved = updateProviderUseCase.execute(updated);
        ProviderResponse response = mapper.toResponse(saved);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Delete provider", description = "Delete (disable) a provider configuration")
    public ResponseEntity<Void> deleteProvider(@PathVariable UUID id, Authentication authentication) {
        String username = authentication.getName();
        log.info("DELETE /api/v1/admin/providers/{} - user={}", id, username);

        deleteProviderUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Test provider", description = "Test provider connectivity and configuration by sending a test message")
    public ResponseEntity<TestProviderResponse> testProvider(
            @PathVariable UUID id,
            @Valid @RequestBody TestProviderRequest request) {
        log.info("POST /api/v1/admin/providers/{}/test - destination={}", id, request.getTestDestination());

        TestProviderResponse response = testProviderUseCase.execute(
                id,
                request.getTestDestination(),
                request.getTestMessage());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/metrics")
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "Get provider metrics", description = """
            Retrieve operational metrics for a specific provider.

            **Internal Metrics (from database):**
            - Request counts (today, 7d, 30d)
            - Success rate
            - Failed requests

            **External Metrics (from MuleSoft - mocked until integration):**
            - Response times and latency percentiles (P50, P95, P99)
            - Uptime and availability
            - Cost per request and totals

            **Note:** The `mulesoft_integrated` field indicates whether metrics
            come from real MuleSoft data or mock data.
            """)
    public ResponseEntity<ProviderMetricsResponse> getProviderMetrics(@PathVariable UUID id) {
        log.info("GET /api/v1/admin/providers/{}/metrics", id);

        return providerMetricsService.getMetrics(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

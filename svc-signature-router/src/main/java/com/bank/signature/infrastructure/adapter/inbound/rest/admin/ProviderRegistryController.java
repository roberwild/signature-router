package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.domain.service.ProviderRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Provider Registry REST Controller
 * Story 13.6: Hot Reload Provider Registry
 * Epic 13: Providers CRUD Management
 * 
 * Endpoints:
 * - GET  /api/v1/admin/registry/stats   - Get registry statistics
 * - POST /api/v1/admin/registry/reload  - Manually reload registry
 */
@RestController
@RequestMapping("/api/v1/admin/registry")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Provider Registry", description = "Provider registry management and statistics")
public class ProviderRegistryController {
    
    private final ProviderRegistry providerRegistry;
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    @Operation(summary = "Get registry statistics", description = "Retrieve provider registry statistics")
    public ResponseEntity<ProviderRegistry.RegistryStats> getStats() {
        log.info("GET /api/v1/admin/registry/stats");
        
        ProviderRegistry.RegistryStats stats = providerRegistry.getStats();
        
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/reload")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reload registry", description = "Manually trigger provider registry reload from database")
    public ResponseEntity<Void> reload() {
        log.info("POST /api/v1/admin/registry/reload");
        
        providerRegistry.reload();
        
        return ResponseEntity.noContent().build();
    }
}


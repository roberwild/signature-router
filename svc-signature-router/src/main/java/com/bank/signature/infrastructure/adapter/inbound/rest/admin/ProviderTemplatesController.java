package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.ProviderTemplateResponse;
import com.bank.signature.application.service.ProviderTemplateService;
import com.bank.signature.domain.model.ProviderType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Provider Templates REST Controller
 * Story 13.7: Provider Templates & Presets
 * Epic 13: Providers CRUD Management
 * 
 * Endpoints:
 * - GET /api/v1/admin/providers/templates         - List all templates
 * - GET /api/v1/admin/providers/templates/{name}  - Get specific template
 */
@RestController
@RequestMapping("/api/v1/admin/providers/templates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Provider Templates", description = "Pre-configured provider templates and presets")
public class ProviderTemplatesController {
    
    private final ProviderTemplateService templateService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    @Operation(summary = "List all provider templates", description = "Get all available provider templates with recommended configurations")
    public ResponseEntity<List<ProviderTemplateResponse>> getAllTemplates(
        @RequestParam(required = false) ProviderType type
    ) {
        log.info("GET /api/v1/admin/providers/templates - type={}", type);
        
        List<ProviderTemplateResponse> templates = type != null
            ? templateService.getTemplatesByType(type)
            : templateService.getAllTemplates();
        
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/{name}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPPORT')")
    @Operation(summary = "Get provider template", description = "Get specific provider template by name")
    public ResponseEntity<ProviderTemplateResponse> getTemplate(@PathVariable String name) {
        log.info("GET /api/v1/admin/providers/templates/{}", name);
        
        return templateService.getTemplate(name)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}


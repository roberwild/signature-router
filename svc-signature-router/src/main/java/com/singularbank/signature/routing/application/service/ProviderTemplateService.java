package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.response.ProviderTemplateResponse;
import com.singularbank.signature.routing.domain.model.ProviderType;

import java.util.List;
import java.util.Optional;

/**
 * Provider Template Service
 * Story 13.7: Provider Templates & Presets
 * Epic 13: Providers CRUD Management
 * 
 * Provides pre-configured templates for common providers.
 * Helps admins quickly create providers with best-practice defaults.
 */
public interface ProviderTemplateService {
    
    /**
     * Get all available templates
     */
    List<ProviderTemplateResponse> getAllTemplates();
    
    /**
     * Get templates for specific provider type
     */
    List<ProviderTemplateResponse> getTemplatesByType(ProviderType type);
    
    /**
     * Get specific template by name
     */
    Optional<ProviderTemplateResponse> getTemplate(String templateName);
}


package com.singularbank.signature.routing.application.usecase.provider;

import com.singularbank.signature.routing.application.dto.response.TestProviderResponse;

import java.util.UUID;

/**
 * Test Provider Use Case
 * Story 13.8: Provider Testing & Validation
 * Epic 13: Providers CRUD Management
 * 
 * Tests provider connectivity and configuration.
 * Sends a test message to verify provider is working.
 */
public interface TestProviderUseCase {
    
    /**
     * Test provider by sending a test message
     * 
     * @param providerId Provider ID
     * @param testDestination Test phone number/address
     * @param testMessage Optional test message
     * @return Test result
     */
    TestProviderResponse execute(UUID providerId, String testDestination, String testMessage);
}


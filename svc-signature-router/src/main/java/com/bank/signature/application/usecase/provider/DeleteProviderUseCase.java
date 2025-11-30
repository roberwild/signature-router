package com.bank.signature.application.usecase.provider;

import java.util.UUID;

/**
 * Delete Provider Use Case
 * Story 13.3: Provider CRUD Use Cases
 * Epic 13: Providers CRUD Management
 */
public interface DeleteProviderUseCase {
    void execute(UUID providerId);
}


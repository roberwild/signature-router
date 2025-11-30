package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.ProviderConfigHistoryEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Provider Config History JPA Repository
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 */
@Repository
public interface ProviderConfigHistoryJpaRepository extends JpaRepository<ProviderConfigHistoryEntity, UUID> {
    
    /**
     * Find all history for a provider, ordered by changed_at descending
     */
    List<ProviderConfigHistoryEntity> findByProviderConfigIdOrderByChangedAtDesc(UUID providerConfigId);
    
    /**
     * Find recent history across all providers
     */
    List<ProviderConfigHistoryEntity> findAllByOrderByChangedAtDesc(Pageable pageable);
}


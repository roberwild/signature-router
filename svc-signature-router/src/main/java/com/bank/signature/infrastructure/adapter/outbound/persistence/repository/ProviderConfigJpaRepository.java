package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.domain.model.ProviderType;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.ProviderConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Provider Config Spring Data JPA Repository
 * Story 13.2: Provider Domain Model & Repository
 * Epic 13: Providers CRUD Management
 * 
 * Spring Data JPA repository for provider_config table.
 * Provides automatic implementation of common queries.
 */
@Repository
public interface ProviderConfigJpaRepository extends JpaRepository<ProviderConfigEntity, UUID> {
    
    /**
     * Find provider by unique code
     */
    Optional<ProviderConfigEntity> findByProviderCode(String providerCode);
    
    /**
     * Find all providers of a specific type
     */
    List<ProviderConfigEntity> findByProviderType(ProviderType providerType);
    
    /**
     * Find all enabled or disabled providers
     */
    List<ProviderConfigEntity> findByEnabled(boolean enabled);
    
    /**
     * Find all enabled providers of a specific type, ordered by priority
     * This is the main query for fallback chain
     */
    List<ProviderConfigEntity> findByProviderTypeAndEnabledOrderByPriorityAsc(
        ProviderType providerType, 
        boolean enabled
    );
    
    /**
     * Check if provider code exists
     */
    boolean existsByProviderCode(String providerCode);
    
    /**
     * Check if provider code exists excluding specific ID
     * Used for update validation
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
           "FROM ProviderConfigEntity p " +
           "WHERE p.providerCode = :providerCode " +
           "AND p.id <> :excludeId")
    boolean existsByProviderCodeAndIdNot(
        @Param("providerCode") String providerCode,
        @Param("excludeId") UUID excludeId
    );
    
    /**
     * Count providers by type
     */
    long countByProviderType(ProviderType providerType);
    
    /**
     * Count enabled providers
     */
    long countByEnabled(boolean enabled);
}


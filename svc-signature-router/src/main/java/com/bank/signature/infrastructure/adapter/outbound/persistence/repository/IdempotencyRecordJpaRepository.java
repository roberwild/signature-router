package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.IdempotencyRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Spring Data JPA repository for IdempotencyRecordEntity.
 * 
 * @since Story 10.5
 */
@Repository
public interface IdempotencyRecordJpaRepository extends JpaRepository<IdempotencyRecordEntity, String> {
    
    /**
     * Find idempotency record by key.
     * 
     * @param idempotencyKey Idempotency key
     * @return Optional containing entity if found, empty otherwise
     */
    Optional<IdempotencyRecordEntity> findByIdempotencyKey(String idempotencyKey);
    
    /**
     * Delete expired idempotency records.
     * 
     * @param cutoffTime Records with expiresAt before this time will be deleted
     * @return Number of deleted records
     */
    @Modifying
    @Query("DELETE FROM IdempotencyRecordEntity ir WHERE ir.expiresAt < :cutoffTime")
    int deleteByExpiresAtBefore(@Param("cutoffTime") Instant cutoffTime);
}


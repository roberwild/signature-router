package com.bank.signature.infrastructure.adapter.outbound.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

/**
 * Repository for idempotency records.
 * Story 2.10: Idempotency Enforcement
 */
@Repository
public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {
    
    /**
     * Deletes idempotency records older than specified timestamp.
     * Story 2.10: TTL cleanup (24h retention)
     * 
     * @param cutoffTime Records created before this timestamp will be deleted
     * @return Number of deleted records
     */
    @Modifying
    @Query("DELETE FROM IdempotencyRecord ir WHERE ir.createdAt < :cutoffTime")
    int deleteByCreatedAtBefore(@Param("cutoffTime") Instant cutoffTime);
}


package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.entity.IdempotencyRecord;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Domain port for idempotency record persistence operations.
 * 
 * <p><b>Hexagonal Architecture:</b> This interface is defined in the domain layer
 * and implemented by infrastructure adapters (JPA, MongoDB, etc.).</p>
 * 
 * <p><b>Domain Purity:</b> NO dependencies on JPA, Spring, or any framework.
 * This ensures the domain layer remains pure and independent of infrastructure concerns.</p>
 * 
 * @since Story 10.5
 */
public interface IdempotencyRepository {
    
    /**
     * Find idempotency record by idempotency key.
     * 
     * <p>Returns the record if it exists and has not expired, empty otherwise.</p>
     * 
     * @param idempotencyKey Idempotency key to search for
     * @return Optional containing the record if found and not expired, empty otherwise
     * @throws IllegalArgumentException if idempotencyKey is null or blank
     */
    Optional<IdempotencyRecord> findByKey(String idempotencyKey);
    
    /**
     * Save or update an idempotency record.
     * 
     * <p>If a record with the same idempotency key exists, it will be updated.
     * Otherwise, a new record will be created.</p>
     * 
     * @param record Idempotency record to save
     * @return Saved idempotency record (with generated ID if new)
     * @throws IllegalArgumentException if record is null
     */
    IdempotencyRecord save(IdempotencyRecord record);
    
    /**
     * Delete expired idempotency records.
     * 
     * <p>Removes all records where expiresAt is before the cutoff time.
     * This is typically called by a scheduled cleanup job.</p>
     * 
     * @param cutoffTime Records with expiresAt before this time will be deleted
     * @return Number of deleted records
     * @throws IllegalArgumentException if cutoffTime is null
     */
    int deleteExpired(Instant cutoffTime);
    
    /**
     * Delete idempotency record by ID.
     * 
     * @param id Record ID
     * @throws IllegalArgumentException if id is null
     */
    void deleteById(UUID id);
}


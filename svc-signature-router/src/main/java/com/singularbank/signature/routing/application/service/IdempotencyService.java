package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.domain.exception.IdempotencyKeyConflictException;
import com.singularbank.signature.routing.domain.model.entity.IdempotencyRecord;
import com.singularbank.signature.routing.domain.port.outbound.IdempotencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing idempotency records.
 * 
 * <p>Implements idempotent request processing by:
 * <ul>
 *   <li>Checking if an idempotency key already exists</li>
 *   <li>Validating request hash to detect conflicts</li>
 *   <li>Storing responses for replay on duplicate requests</li>
 *   <li>Cleaning up expired records</li>
 * </ul>
 * </p>
 * 
 * <p><b>Thread Safety:</b> Uses database transactions with appropriate isolation level
 * to handle concurrent requests with the same idempotency key.</p>
 * 
 * @since Story 10.5
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {
    
    private static final int TTL_HOURS = 24;
    
    private final IdempotencyRepository idempotencyRepository;
    
    /**
     * Check if an idempotency key exists and validate request hash.
     * 
     * <p>If the key exists and the request hash matches, returns the cached record.
     * If the key exists but the hash differs, throws IdempotencyKeyConflictException.
     * If the key doesn't exist or has expired, returns empty.</p>
     * 
     * @param idempotencyKey Idempotency key from header
     * @param requestHash SHA-256 hash of request body
     * @return Optional containing cached record if found and valid, empty otherwise
     * @throws IdempotencyKeyConflictException if key exists with different hash
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public Optional<IdempotencyRecord> checkAndStore(String idempotencyKey, String requestHash) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency key cannot be null or blank");
        }
        if (requestHash == null || requestHash.isBlank()) {
            throw new IllegalArgumentException("Request hash cannot be null or blank");
        }
        
        Optional<IdempotencyRecord> existing = idempotencyRepository.findByKey(idempotencyKey);
        Instant now = Instant.now();
        
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            
            // Check if expired
            if (record.isExpired(now)) {
                log.debug("Idempotency key expired: key={}, expiresAt={}", 
                    idempotencyKey, record.getExpiresAt());
                // Return empty - cleanup job will delete expired records
                return Optional.empty();
            }
            
            // Check if request hash matches
            if (!record.matchesRequestHash(requestHash)) {
                log.warn("Idempotency key conflict: key={}, existingHash={}, newHash={}", 
                    idempotencyKey, record.getRequestHash(), requestHash);
                throw new IdempotencyKeyConflictException(idempotencyKey);
            }
            
            // Same request - return cached record
            log.debug("Idempotency key found: key={}, cached", idempotencyKey);
            return Optional.of(record);
        }
        
        // Key doesn't exist - return empty to proceed with new request
        return Optional.empty();
    }
    
    /**
     * Store response for an idempotency key.
     * 
     * <p>Creates a new idempotency record with the response data.
     * If a record with the same key already exists, it will be updated.</p>
     * 
     * @param idempotencyKey Idempotency key
     * @param requestHash SHA-256 hash of request body
     * @param statusCode HTTP status code of response
     * @param responseBody Response body (JSON serialized)
     * @return Created or updated idempotency record
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public IdempotencyRecord storeResponse(
            String idempotencyKey,
            String requestHash,
            Integer statusCode,
            String responseBody) {
        
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency key cannot be null or blank");
        }
        if (requestHash == null || requestHash.isBlank()) {
            throw new IllegalArgumentException("Request hash cannot be null or blank");
        }
        if (statusCode == null) {
            throw new IllegalArgumentException("Status code cannot be null");
        }
        if (responseBody == null) {
            throw new IllegalArgumentException("Response body cannot be null");
        }
        
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(TTL_HOURS * 3600L);
        
        IdempotencyRecord record = IdempotencyRecord.builder()
            .id(UUID.randomUUID()) // Will be generated by adapter if using auto-increment
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(statusCode)
            .responseBody(responseBody)
            .createdAt(now)
            .expiresAt(expiresAt)
            .build();
        
        IdempotencyRecord saved = idempotencyRepository.save(record);
        log.debug("Idempotency record stored: key={}, status={}", idempotencyKey, statusCode);
        
        return saved;
    }
    
    /**
     * Get cached response for an idempotency key.
     * 
     * @param idempotencyKey Idempotency key
     * @return Optional containing cached record if found and not expired, empty otherwise
     */
    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> getCachedResponse(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        
        Optional<IdempotencyRecord> record = idempotencyRepository.findByKey(idempotencyKey);
        
        if (record.isPresent() && !record.get().isExpired(Instant.now())) {
            return record;
        }
        
        return Optional.empty();
    }
    
    /**
     * Clean up expired idempotency records.
     * 
     * <p>Deletes all records where expiresAt is before the current time.
     * This method is typically called by a scheduled job.</p>
     * 
     * @return Number of deleted records
     */
    @Transactional
    public int cleanupExpiredRecords() {
        Instant now = Instant.now();
        int deleted = idempotencyRepository.deleteExpired(now);
        log.info("Cleaned up {} expired idempotency records", deleted);
        return deleted;
    }
}


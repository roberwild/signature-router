package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureRequestEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for SignatureRequestEntity.
 * 
 * <p><b>Hexagonal Architecture Note:</b> This is an INFRASTRUCTURE component,
 * NOT exposed outside persistence package. Domain layer uses SignatureRequestRepository
 * port interface, implemented by SignatureRequestRepositoryAdapter.</p>
 * 
 * <p><b>Custom Queries:</b></p>
 * <ul>
 *   <li>findByIdWithChallenges: Eager loading with @EntityGraph (avoid N+1 queries)</li>
 *   <li>findByCustomerId: Query by customer identifier</li>
 *   <li>findByStatusAndExpiresAtBefore: Find expired requests by status</li>
 * </ul>
 * 
 * @since Story 1.6
 */
@Repository
public interface SignatureRequestJpaRepository extends JpaRepository<SignatureRequestEntity, UUID> {
    
    /**
     * Find signature request by ID with challenges eagerly loaded.
     * 
     * <p><b>Performance:</b> Uses @EntityGraph to fetch challenges in single query,
     * avoiding N+1 problem when accessing lazy-loaded collection.</p>
     * 
     * @param id Signature request ID
     * @return Optional containing entity if found, empty otherwise
     */
    @EntityGraph(attributePaths = {"challenges"})
    @Query("SELECT sr FROM SignatureRequestEntity sr WHERE sr.id = :id")
    Optional<SignatureRequestEntity> findByIdWithChallenges(@Param("id") UUID id);
    
    /**
     * Find all signature requests by customer ID.
     * 
     * <p>Results are implicitly ordered by creation date (database default).</p>
     * 
     * @param customerId Customer identifier (pseudonymized)
     * @return List of entities (empty if none found)
     */
    List<SignatureRequestEntity> findByCustomerId(String customerId);
    
    /**
     * Find expired signature requests (status filter + expiresAt before cutoff).
     * 
     * <p><b>Use Case:</b> Background job to mark expired requests and trigger cleanup.</p>
     * 
     * <p><b>Example:</b></p>
     * <pre>{@code
     * // Find all PENDING requests expired before now
     * List<SignatureRequestEntity> expired = repository.findByStatusAndExpiresAtBefore(
     *     "PENDING", Instant.now());
     * }</pre>
     * 
     * @param status Status filter (e.g., "PENDING", "CHALLENGED")
     * @param expiresAt Cutoff timestamp
     * @return List of expired entities (empty if none found)
     */
    List<SignatureRequestEntity> findByStatusAndExpiresAtBefore(String status, Instant expiresAt);
    
    /**
     * Find signature requests with expired challenges.
     * Story 2.9: Challenge Expiration Background Job
     * 
     * <p><b>Query Logic:</b> Finds signature requests that have challenges with:</p>
     * <ul>
     *   <li>status IN ('PENDING', 'SENT')</li>
     *   <li>expiresAt < current timestamp</li>
     * </ul>
     * 
     * <p><b>Performance:</b></p>
     * <ul>
     *   <li>Uses JOIN FETCH to avoid N+1 queries</li>
     *   <li>Limits results to batch size via Pageable</li>
     *   <li>Index on (status, expires_at) recommended</li>
     * </ul>
     * 
     * @param currentTime Current timestamp for expiration comparison
     * @param pageable Pagination parameters (use PageRequest.of(0, batchSize))
     * @return List of signature requests with expired challenges
     */
    @Query("""
        SELECT DISTINCT sr FROM SignatureRequestEntity sr
        JOIN FETCH sr.challenges c
        WHERE c.status IN ('PENDING', 'SENT')
        AND c.expiresAt < :currentTime
        ORDER BY c.expiresAt ASC
        """)
    List<SignatureRequestEntity> findWithExpiredChallenges(
        @Param("currentTime") Instant currentTime,
        Pageable pageable
    );
    
    /**
     * Find signature requests by status with pagination and sorting.
     * Story 4.3: Degraded Mode Manager - Queue Strategy
     * 
     * <p>Used to query PENDING_DEGRADED requests for recovery processing.
     * Typically ordered by createdAt ASC (FIFO) for fairness.</p>
     * 
     * <p><b>Usage Example:</b></p>
     * <pre>{@code
     * // Find first 100 PENDING_DEGRADED requests in FIFO order
     * List<SignatureRequestEntity> queued = repository.findByStatus(
     *     "PENDING_DEGRADED",
     *     PageRequest.of(0, 100, Sort.by("createdAt").ascending())
     * );
     * }</pre>
     * 
     * @param status   Signature request status (e.g., "PENDING_DEGRADED")
     * @param pageable Pagination and sorting configuration
     * @return List of signature requests with matching status
     * @since Story 4.3
     */
    @EntityGraph(attributePaths = {"challenges"})
    List<SignatureRequestEntity> findByStatus(String status, Pageable pageable);
    
    // ========================================
    // Dashboard Metrics Counting Methods
    // Story 12.1: Dashboard Metrics Endpoint
    // ========================================
    
    /**
     * Count signature requests created between two timestamps.
     * 
     * @param from Start timestamp (inclusive)
     * @param to   End timestamp (exclusive)
     * @return Count of signature requests in the time range
     * @since Story 12.1
     */
    long countByCreatedAtBetween(Instant from, Instant to);
    
    /**
     * Count signature requests by status created between two timestamps.
     * 
     * @param status Signature status (e.g., "VALIDATED", "FAILED")
     * @param from   Start timestamp (inclusive)
     * @param to     End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    long countByStatusAndCreatedAtBetween(String status, Instant from, Instant to);
    
    /**
     * Count signature requests by channel created between two timestamps.
     * 
     * @param channel Channel (e.g., "SMS", "PUSH", "VOICE", "BIOMETRIC")
     * @param from    Start timestamp (inclusive)
     * @param to      End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    long countByChannelAndCreatedAtBetween(String channel, Instant from, Instant to);
    
    /**
     * Count signature requests by channel and status created between two timestamps.
     * 
     * @param channel Channel (e.g., "SMS", "PUSH")
     * @param status  Signature status (e.g., "VALIDATED")
     * @param from    Start timestamp (inclusive)
     * @param to      End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    long countByChannelAndStatusAndCreatedAtBetween(
        String channel,
        String status,
        Instant from,
        Instant to
    );
    
    // ========================================
    // Admin Query Methods with Filters
    // Story 12.2: Admin Signatures Endpoint con Filtros
    // ========================================
    
    /**
     * Find all signature requests with optional filters and pagination.
     * Uses dynamic query with optional filters.
     * 
     * @param status    Optional status filter (null = no filter)
     * @param channel   Optional channel filter (null = no filter)
     * @param dateFrom  Optional start date filter (null = no filter)
     * @param dateTo    Optional end date filter (null = no filter)
     * @param pageable  Pagination and sorting configuration
     * @return Page of signature requests matching filters
     * @since Story 12.2
     */
    @Query("""
        SELECT sr FROM SignatureRequestEntity sr
        WHERE (:status IS NULL OR sr.status = :status)
        AND (:channel IS NULL OR sr.channel = :channel)
        AND (:dateFrom IS NULL OR sr.createdAt >= :dateFrom)
        AND (:dateTo IS NULL OR sr.createdAt < :dateTo)
        """)
    @EntityGraph(attributePaths = {"challenges"})
    Page<SignatureRequestEntity> findAllWithFilters(
        @Param("status") String status,
        @Param("channel") String channel,
        @Param("dateFrom") Instant dateFrom,
        @Param("dateTo") Instant dateTo,
        Pageable pageable
    );
}


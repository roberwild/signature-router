package com.singularbank.signature.routing.domain.port.outbound;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;

import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.model.valueobject.Channel;
import com.singularbank.signature.routing.domain.model.valueobject.ChannelStats;
import com.singularbank.signature.routing.domain.model.valueobject.SignatureStatus;

/**
 * Domain port interface for SignatureRequest persistence operations.
 * 
 * <p>
 * <b>Hexagonal Architecture:</b> This interface is defined in the domain layer
 * and implemented by infrastructure adapters (JPA, MongoDB, etc.).
 * </p>
 * 
 * <p>
 * <b>Domain Purity:</b> NO dependencies on JPA, Spring, Jackson, or any
 * framework.
 * This ensures the domain layer remains pure and independent of infrastructure
 * concerns.
 * </p>
 * 
 * <p>
 * <b>Usage Example:</b>
 * </p>
 * 
 * <pre>{@code
 * // In a use case (application layer)
 * SignatureRequest request = SignatureRequest.builder()
 *         .id(UUIDGenerator.generateV7())
 *         .customerId("customer-123")
 *         .status(SignatureStatus.PENDING)
 *         .build();
 * 
 * SignatureRequest saved = repository.save(request);
 * Optional<SignatureRequest> found = repository.findById(saved.getId());
 * }</pre>
 * 
 * @since Story 1.6
 */
public interface SignatureRequestRepository {

    /**
     * Save or update a signature request.
     * 
     * <p>
     * If the signature request has no ID (null), a new ID will be generated.
     * If the signature request has an existing ID, the record will be updated.
     * </p>
     * 
     * @param request Domain aggregate to persist
     * @return Persisted domain aggregate with generated ID (if new)
     * @throws IllegalArgumentException if request is null
     */
    SignatureRequest save(SignatureRequest request);

    /**
     * Find signature request by ID.
     * 
     * <p>
     * This method eagerly loads associated challenges to avoid lazy loading issues.
     * </p>
     * 
     * @param id Signature request ID (UUIDv7)
     * @return Optional containing domain aggregate if found, empty otherwise
     * @throws IllegalArgumentException if id is null
     */
    Optional<SignatureRequest> findById(UUID id);

    /**
     * Find all signature requests for a given customer.
     * 
     * <p>
     * This is useful for customer service inquiries and analytics.
     * Results are ordered by creation date (newest first).
     * </p>
     * 
     * @param customerId Customer identifier (pseudonymized)
     * @return List of domain aggregates (empty if none found)
     * @throws IllegalArgumentException if customerId is null or blank
     */
    List<SignatureRequest> findByCustomerId(String customerId);

    /**
     * Find expired signature requests (expiresAt before cutoff time).
     * 
     * <p>
     * This method is used by background jobs to mark expired requests
     * and trigger cleanup/notification processes.
     * </p>
     * 
     * <p>
     * <b>Note:</b> Only returns requests with status PENDING or CHALLENGED.
     * </p>
     * 
     * @param cutoffTime Cutoff timestamp (e.g., Instant.now())
     * @return List of expired domain aggregates (empty if none found)
     * @throws IllegalArgumentException if cutoffTime is null
     */
    List<SignatureRequest> findExpired(Instant cutoffTime);

    /**
     * Delete signature request by ID.
     * 
     * <p>
     * <b>Note:</b> This performs a hard delete. For audit purposes,
     * consider soft delete (status = DELETED) in future iterations.
     * </p>
     * 
     * <p>
     * Cascade delete will automatically remove associated challenges.
     * </p>
     * 
     * @param id Signature request ID
     * @throws IllegalArgumentException if id is null
     */
    void delete(UUID id);

    /**
     * Find signature requests by status with pagination and sorting.
     * Story 4.3: Degraded Mode Manager - Queue Strategy
     * 
     * <p>
     * Used to query PENDING_DEGRADED requests for recovery processing.
     * Results are typically ordered by createdAt ASC (FIFO) for fairness.
     * </p>
     * 
     * @param status   Signature request status to filter by
     * @param pageable Pagination and sorting configuration (e.g., PageRequest.of(0,
     *                 100, Sort.by("createdAt")))
     * @return List of signature requests with matching status (empty if none found)
     * @throws IllegalArgumentException if status or pageable is null
     * @since Story 4.3
     */
    List<SignatureRequest> findByStatus(SignatureStatus status, Pageable pageable);

    // ========================================
    // Dashboard Metrics Methods
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
     * @param status Signature status to filter by
     * @param from   Start timestamp (inclusive)
     * @param to     End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    long countByStatusAndCreatedAtBetween(SignatureStatus status, Instant from, Instant to);

    /**
     * Count signature requests by channel created between two timestamps.
     * 
     * @param channel Channel to filter by
     * @param from    Start timestamp (inclusive)
     * @param to      End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    // TEMPORALMENTE DESHABILITADO - SignatureRequestEntity no tiene campo 'channel'
    // long countByChannelAndCreatedAtBetween(Channel channel, Instant from, Instant
    // to);

    /**
     * Count signature requests by channel and status created between two
     * timestamps.
     * 
     * TODO: Implementar cuando SignatureRequestEntity tenga campo 'channel'
     * 
     * @param channel Channel to filter by
     * @param status  Signature status to filter by
     * @param from    Start timestamp (inclusive)
     * @param to      End timestamp (exclusive)
     * @return Count of matching signature requests
     * @since Story 12.1
     */
    // TEMPORALMENTE DESHABILITADO - SignatureRequestEntity no tiene campo 'channel'
    // long countByChannelAndStatusAndCreatedAtBetween(
    // Channel channel,
    // SignatureStatus status,
    // Instant from,
    // Instant to
    // );

    // ========================================
    // Admin Query Methods with Filters
    // Story 12.2: Admin Signatures Endpoint con Filtros
    // ========================================

    /**
     * Find all signature requests with optional filters and pagination.
     * 
     * All filter parameters are optional (null = no filter applied).
     * 
     * @param status   Optional status filter
     * @param channel  Optional channel filter
     * @param dateFrom Optional start date filter (inclusive)
     * @param dateTo   Optional end date filter (exclusive)
     * @param pageable Pagination and sorting configuration
     * @return Page of signature requests matching filters
     * @since Story 12.2
     */
    org.springframework.data.domain.Page<SignatureRequest> findAllWithFilters(
            SignatureStatus status,
            Channel channel,
            Instant dateFrom,
            Instant dateTo,
            Pageable pageable);

    // ========================================
    // Signature Duration Analytics Methods
    // Story 12.4: Metrics Analytics - Signature Duration
    // ========================================

    /**
     * Find completed signature requests (with signedAt not null) between two
     * timestamps.
     * Used to calculate signature duration metrics (time from creation to
     * completion).
     * 
     * @param from Start timestamp (inclusive) - filters by signedAt
     * @param to   End timestamp (exclusive) - filters by signedAt
     * @return List of completed signature requests
     * @since Story 12.4
     */
    List<SignatureRequest> findCompletedBetween(Instant from, Instant to);

    /**
     * Count completed signature requests (with signedAt not null) between two
     * timestamps.
     * 
     * @param from Start timestamp (inclusive) - filters by signedAt
     * @param to   End timestamp (exclusive) - filters by signedAt
     * @return Count of completed signature requests
     * @since Story 12.4
     */
    long countCompletedBetween(Instant from, Instant to);

    // ========================================
    // Challenge Completion Analytics Methods
    // Story 12.4: Metrics Analytics - Challenge Completion
    // ========================================

    /**
     * Find signature requests with completed challenges in the given range.
     * 
     * @param from Start timestamp (inclusive) - filters by challenge completedAt
     * @param to   End timestamp (exclusive) - filters by challenge completedAt
     * @return List of signature requests with completed challenges
     * @since Story 12.4
     */
    List<SignatureRequest> findWithCompletedChallengesBetween(Instant from, Instant to);

    /**
     * Find signature requests with sent challenges in the given range.
     * 
     * @param from Start timestamp (inclusive) - filters by challenge sentAt
     * @param to   End timestamp (exclusive) - filters by challenge sentAt
     * @return List of signature requests with sent challenges
     * @since Story 12.4
     */
    List<SignatureRequest> findWithSentChallengesBetween(Instant from, Instant to);

    // ========================================
    // Channel Metrics via Challenges
    // Story 12.5: Dashboard Channel Distribution
    // ========================================

    /**
     * Get channel distribution - count of challenges per channel type.
     * Since SignatureRequest doesn't have a channel field, we derive this from
     * challenges.
     * 
     * @param from Start timestamp (inclusive)
     * @param to   End timestamp (exclusive)
     * @return Map of channel name to count
     * @since Story 12.5
     */
    Map<String, Long> getChannelDistribution(Instant from, Instant to);

    /**
     * Get channel success rates - total and successful challenges per channel.
     * Returns a map with channel name as key and [totalCount, successCount] as
     * value.
     * 
     * @param from Start timestamp (inclusive)
     * @param to   End timestamp (exclusive)
     * @return Map of channel name to ChannelStats record
     * @since Story 12.5
     */
    Map<String, ChannelStats> getChannelSuccessRates(Instant from, Instant to);

}

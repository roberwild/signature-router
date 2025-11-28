package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Domain port interface for SignatureRequest persistence operations.
 * 
 * <p><b>Hexagonal Architecture:</b> This interface is defined in the domain layer
 * and implemented by infrastructure adapters (JPA, MongoDB, etc.).</p>
 * 
 * <p><b>Domain Purity:</b> NO dependencies on JPA, Spring, Jackson, or any framework.
 * This ensures the domain layer remains pure and independent of infrastructure concerns.</p>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // In a use case (application layer)
 * SignatureRequest request = SignatureRequest.builder()
 *     .id(UUIDGenerator.generateV7())
 *     .customerId("customer-123")
 *     .status(SignatureStatus.PENDING)
 *     .build();
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
     * <p>If the signature request has no ID (null), a new ID will be generated.
     * If the signature request has an existing ID, the record will be updated.</p>
     * 
     * @param request Domain aggregate to persist
     * @return Persisted domain aggregate with generated ID (if new)
     * @throws IllegalArgumentException if request is null
     */
    SignatureRequest save(SignatureRequest request);
    
    /**
     * Find signature request by ID.
     * 
     * <p>This method eagerly loads associated challenges to avoid lazy loading issues.</p>
     * 
     * @param id Signature request ID (UUIDv7)
     * @return Optional containing domain aggregate if found, empty otherwise
     * @throws IllegalArgumentException if id is null
     */
    Optional<SignatureRequest> findById(UUID id);
    
    /**
     * Find all signature requests for a given customer.
     * 
     * <p>This is useful for customer service inquiries and analytics.
     * Results are ordered by creation date (newest first).</p>
     * 
     * @param customerId Customer identifier (pseudonymized)
     * @return List of domain aggregates (empty if none found)
     * @throws IllegalArgumentException if customerId is null or blank
     */
    List<SignatureRequest> findByCustomerId(String customerId);
    
    /**
     * Find expired signature requests (expiresAt before cutoff time).
     * 
     * <p>This method is used by background jobs to mark expired requests
     * and trigger cleanup/notification processes.</p>
     * 
     * <p><b>Note:</b> Only returns requests with status PENDING or CHALLENGED.</p>
     * 
     * @param cutoffTime Cutoff timestamp (e.g., Instant.now())
     * @return List of expired domain aggregates (empty if none found)
     * @throws IllegalArgumentException if cutoffTime is null
     */
    List<SignatureRequest> findExpired(Instant cutoffTime);
    
    /**
     * Delete signature request by ID.
     * 
     * <p><b>Note:</b> This performs a hard delete. For audit purposes,
     * consider soft delete (status = DELETED) in future iterations.</p>
     * 
     * <p>Cascade delete will automatically remove associated challenges.</p>
     * 
     * @param id Signature request ID
     * @throws IllegalArgumentException if id is null
     */
    void delete(UUID id);
    
    /**
     * Find signature requests by status with pagination and sorting.
     * Story 4.3: Degraded Mode Manager - Queue Strategy
     * 
     * <p>Used to query PENDING_DEGRADED requests for recovery processing.
     * Results are typically ordered by createdAt ASC (FIFO) for fairness.</p>
     * 
     * @param status    Signature request status to filter by
     * @param pageable  Pagination and sorting configuration (e.g., PageRequest.of(0, 100, Sort.by("createdAt")))
     * @return List of signature requests with matching status (empty if none found)
     * @throws IllegalArgumentException if status or pageable is null
     * @since Story 4.3
     */
    List<SignatureRequest> findByStatus(SignatureStatus status, Pageable pageable);
}


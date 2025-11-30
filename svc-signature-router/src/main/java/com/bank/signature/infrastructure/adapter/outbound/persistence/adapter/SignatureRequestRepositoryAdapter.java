package com.bank.signature.infrastructure.adapter.outbound.persistence.adapter;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.SignatureRequestEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.mapper.SignatureRequestEntityMapper;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.SignatureRequestJpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JPA adapter implementing domain repository port (Hexagonal Architecture).
 * 
 * <p><b>Hexagonal Architecture Pattern:</b></p>
 * <ul>
 *   <li><b>Domain Port:</b> SignatureRequestRepository interface (domain/port/outbound/)</li>
 *   <li><b>Infrastructure Adapter:</b> This class (infrastructure/adapter/outbound/persistence/)</li>
 *   <li><b>Benefit:</b> Domain layer remains pure, infrastructure can be swapped (e.g., MongoDB adapter)</li>
 * </ul>
 * 
 * <p><b>Responsibilities:</b></p>
 * <ul>
 *   <li>Implement domain port interface methods</li>
 *   <li>Delegate persistence operations to Spring Data JPA repository</li>
 *   <li>Convert between domain models and JPA entities via mapper</li>
 *   <li>Return ONLY domain models (NEVER JPA entities)</li>
 * </ul>
 * 
 * <p><b>Transactional Behavior:</b></p>
 * <ul>
 *   <li>Write methods (save, delete): @Transactional (read-only = false)</li>
 *   <li>Read methods (findById, findByCustomerId, findExpired): @Transactional(readOnly = true)</li>
 *   <li>Automatic rollback on RuntimeException</li>
 * </ul>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // In a use case (application layer)
 * @Service
 * public class CreateSignatureRequestUseCase {
 *     private final SignatureRequestRepository repository; // Injected domain port
 *     
 *     public SignatureRequest execute(CreateSignatureRequestCommand cmd) {
 *         SignatureRequest request = SignatureRequest.builder()...build();
 *         return repository.save(request); // Uses THIS adapter under the hood
 *     }
 * }
 * }</pre>
 * 
 * @since Story 1.6
 */
@Component
public class SignatureRequestRepositoryAdapter implements SignatureRequestRepository {
    
    private final SignatureRequestJpaRepository jpaRepository;
    private final SignatureRequestEntityMapper mapper;
    
    /**
     * Constructor with dependency injection.
     * 
     * @param jpaRepository Spring Data JPA repository
     * @param mapper Entity mapper for domain ↔ entity conversions
     */
    public SignatureRequestRepositoryAdapter(
            SignatureRequestJpaRepository jpaRepository,
            SignatureRequestEntityMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    
    /**
     * Save or update a signature request.
     * 
     * <p><b>Process:</b></p>
     * <ol>
     *   <li>Convert domain aggregate to JPA entity (mapper.toEntity)</li>
     *   <li>Persist entity via Spring Data JPA (jpaRepository.save)</li>
     *   <li>Convert persisted entity back to domain aggregate (mapper.toDomain)</li>
     *   <li>Return domain aggregate (NEVER JPA entity)</li>
     * </ol>
     * 
     * <p><b>Cascade Behavior:</b> Challenges are automatically persisted with parent
     * (cascade = ALL in SignatureRequestEntity).</p>
     * 
     * @param request Domain aggregate to persist
     * @return Persisted domain aggregate
     */
    @Override
    @Transactional
    public SignatureRequest save(SignatureRequest request) {
        SignatureRequestEntity entity = mapper.toEntity(request);
        SignatureRequestEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }
    
    /**
     * Find signature request by ID (with challenges eagerly loaded).
     * 
     * <p><b>Performance:</b> Uses findByIdWithChallenges to eagerly load challenges
     * in single query (avoid N+1 problem).</p>
     * 
     * @param id Signature request ID
     * @return Optional containing domain aggregate if found, empty otherwise
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<SignatureRequest> findById(UUID id) {
        return jpaRepository.findByIdWithChallenges(id)
            .map(mapper::toDomain);
    }
    
    /**
     * Find all signature requests for a given customer.
     * 
     * @param customerId Customer identifier (pseudonymized)
     * @return List of domain aggregates (empty if none found)
     */
    @Override
    @Transactional(readOnly = true)
    public List<SignatureRequest> findByCustomerId(String customerId) {
        return jpaRepository.findByCustomerId(customerId).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    /**
     * Find expired signature requests (expiresAt before cutoff time).
     * 
     * <p><b>Implementation Note:</b> Currently queries only PENDING requests.
     * In future, may query multiple statuses (PENDING, CHALLENGED).</p>
     * 
     * @param cutoffTime Cutoff timestamp (e.g., Instant.now())
     * @return List of expired domain aggregates
     */
    @Override
    @Transactional(readOnly = true)
    public List<SignatureRequest> findExpired(Instant cutoffTime) {
        return jpaRepository.findByStatusAndExpiresAtBefore("PENDING", cutoffTime).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    /**
     * Delete signature request by ID.
     * 
     * <p><b>Cascade Behavior:</b> Challenges are automatically deleted
     * (ON DELETE CASCADE in database schema).</p>
     * 
     * <p><b>Future Enhancement:</b> Consider soft delete (status = DELETED)
     * for audit purposes.</p>
     * 
     * @param id Signature request ID
     */
    @Override
    @Transactional
    public void delete(UUID id) {
        jpaRepository.deleteById(id);
    }
    
    /**
     * Find signature requests by status with pagination and sorting.
     * Story 4.3: Degraded Mode Manager - Queue Strategy
     * 
     * <p>Used to query PENDING_DEGRADED requests for recovery processing.
     * Typically ordered by createdAt ASC (FIFO) for fairness.</p>
     * 
     * @param status   Signature request status to filter by
     * @param pageable Pagination and sorting configuration
     * @return List of signature requests with matching status
     * @since Story 4.3
     */
    @Override
    @Transactional(readOnly = true)
    public List<SignatureRequest> findByStatus(SignatureStatus status, Pageable pageable) {
        return jpaRepository.findByStatus(status.name(), pageable).stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}


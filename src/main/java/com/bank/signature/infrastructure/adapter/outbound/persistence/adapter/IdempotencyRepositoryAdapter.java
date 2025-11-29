package com.bank.signature.infrastructure.adapter.outbound.persistence.adapter;

import com.bank.signature.domain.model.entity.IdempotencyRecord;
import com.bank.signature.domain.port.outbound.IdempotencyRepository;
import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.IdempotencyRecordEntity;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.IdempotencyRecordJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA adapter implementing IdempotencyRepository domain port.
 * 
 * <p><b>Hexagonal Architecture:</b> Infrastructure adapter that implements domain port.</p>
 * 
 * @since Story 10.5
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyRepositoryAdapter implements IdempotencyRepository {
    
    private final IdempotencyRecordJpaRepository jpaRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> findByKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        
        return jpaRepository.findByIdempotencyKey(idempotencyKey)
            .map(IdempotencyRecordEntity::toDomain)
            .filter(record -> !record.isExpired(Instant.now())); // Filter expired records
    }
    
    @Override
    @Transactional
    public IdempotencyRecord save(IdempotencyRecord record) {
        if (record == null) {
            throw new IllegalArgumentException("Record cannot be null");
        }
        
        IdempotencyRecordEntity entity = IdempotencyRecordEntity.fromDomain(record);
        IdempotencyRecordEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }
    
    @Override
    @Transactional
    public int deleteExpired(Instant cutoffTime) {
        if (cutoffTime == null) {
            throw new IllegalArgumentException("Cutoff time cannot be null");
        }
        
        return jpaRepository.deleteByExpiresAtBefore(cutoffTime);
    }
    
    @Override
    @Transactional
    public void deleteById(UUID id) {
        // Note: DB uses idempotency_key as PK, not id
        // This method is not directly supported by the current schema
        // For now, we'll need to find by key and delete
        // This is a limitation that should be addressed in future refactoring
        throw new UnsupportedOperationException(
            "deleteById not supported - use deleteByKey instead. " +
            "DB schema uses idempotency_key as primary key, not id."
        );
    }
    
    /**
     * Delete by idempotency key (helper method for internal use).
     * 
     * @param idempotencyKey Idempotency key
     */
    @Transactional
    public void deleteByKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency key cannot be null or blank");
        }
        
        jpaRepository.deleteById(idempotencyKey);
    }
}


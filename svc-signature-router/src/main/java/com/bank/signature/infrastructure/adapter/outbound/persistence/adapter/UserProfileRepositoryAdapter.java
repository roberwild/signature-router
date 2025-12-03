package com.bank.signature.infrastructure.adapter.outbound.persistence.adapter;

import com.bank.signature.domain.model.entity.UserProfile;
import com.bank.signature.domain.port.outbound.UserProfileRepository;
import com.bank.signature.infrastructure.adapter.outbound.persistence.mapper.UserProfileEntityMapper;
import com.bank.signature.infrastructure.adapter.outbound.persistence.repository.UserProfileJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JPA adapter implementing UserProfileRepository port.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Component
@RequiredArgsConstructor
public class UserProfileRepositoryAdapter implements UserProfileRepository {
    
    private final UserProfileJpaRepository jpaRepository;
    private final UserProfileEntityMapper mapper;
    
    @Override
    @Transactional
    public UserProfile save(UserProfile profile) {
        var entity = mapper.toEntity(profile);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> findByKeycloakId(String keycloakId) {
        return jpaRepository.findByKeycloakId(keycloakId).map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> findByUsername(String username) {
        return jpaRepository.findByUsername(username).map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserProfile> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserProfile> findAllActive() {
        return jpaRepository.findByActiveTrue().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long count() {
        return jpaRepository.count();
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countActive() {
        return jpaRepository.countByActiveTrue();
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countByRole(String role) {
        // Format role as JSON array element for JSONB contains query
        String roleJson = "[\"" + role + "\"]";
        return jpaRepository.countByRoleNative(roleJson);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserProfile> search(String searchTerm, Pageable pageable) {
        return jpaRepository.search(searchTerm, pageable).map(mapper::toDomain);
    }
}


package com.bank.signature.infrastructure.adapter.outbound.persistence.repository;

import com.bank.signature.infrastructure.adapter.outbound.persistence.entity.UserProfileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for UserProfileEntity.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Repository
public interface UserProfileJpaRepository extends JpaRepository<UserProfileEntity, UUID> {
    
    /**
     * Find by Keycloak subject ID.
     */
    Optional<UserProfileEntity> findByKeycloakId(String keycloakId);
    
    /**
     * Find by username.
     */
    Optional<UserProfileEntity> findByUsername(String username);
    
    /**
     * Find by email.
     */
    Optional<UserProfileEntity> findByEmail(String email);
    
    /**
     * Find all active users.
     */
    List<UserProfileEntity> findByActiveTrue();
    
    /**
     * Count active users.
     */
    long countByActiveTrue();
    
    /**
     * Count users by role (using JSONB contains).
     */
    @Query(value = "SELECT COUNT(*) FROM user_profile WHERE roles @> :role::jsonb", nativeQuery = true)
    long countByRoleNative(@Param("role") String roleJson);
    
    /**
     * Search by username, email, or full name.
     */
    @Query("""
        SELECT u FROM UserProfileEntity u
        WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%'))
        OR LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%'))
        OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :term, '%'))
        """)
    Page<UserProfileEntity> search(@Param("term") String searchTerm, Pageable pageable);
}


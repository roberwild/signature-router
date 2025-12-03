package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.entity.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Domain port interface for UserProfile persistence operations.
 * 
 * <p><b>Hexagonal Architecture:</b> This interface is defined in the domain layer
 * and implemented by infrastructure adapters.</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
public interface UserProfileRepository {
    
    /**
     * Save or update a user profile.
     * 
     * @param profile User profile to persist
     * @return Persisted user profile
     */
    UserProfile save(UserProfile profile);
    
    /**
     * Find user profile by ID.
     * 
     * @param id User profile ID
     * @return Optional containing profile if found
     */
    Optional<UserProfile> findById(UUID id);
    
    /**
     * Find user profile by Keycloak subject ID.
     * 
     * @param keycloakId Keycloak subject ID (sub claim)
     * @return Optional containing profile if found
     */
    Optional<UserProfile> findByKeycloakId(String keycloakId);
    
    /**
     * Find user profile by username.
     * 
     * @param username Username
     * @return Optional containing profile if found
     */
    Optional<UserProfile> findByUsername(String username);
    
    /**
     * Find user profile by email.
     * 
     * @param email Email address
     * @return Optional containing profile if found
     */
    Optional<UserProfile> findByEmail(String email);
    
    /**
     * Find all user profiles with pagination.
     * 
     * @param pageable Pagination configuration
     * @return Page of user profiles
     */
    Page<UserProfile> findAll(Pageable pageable);
    
    /**
     * Find all active user profiles.
     * 
     * @return List of active user profiles
     */
    List<UserProfile> findAllActive();
    
    /**
     * Count total user profiles.
     * 
     * @return Total count
     */
    long count();
    
    /**
     * Count active user profiles.
     * 
     * @return Active count
     */
    long countActive();
    
    /**
     * Count user profiles by role.
     * 
     * @param role Role to filter by
     * @return Count of users with the role
     */
    long countByRole(String role);
    
    /**
     * Search user profiles by username, email, or name.
     * 
     * @param searchTerm Search term
     * @param pageable Pagination configuration
     * @return Page of matching user profiles
     */
    Page<UserProfile> search(String searchTerm, Pageable pageable);
}


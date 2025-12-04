package com.bank.signature.application.service;

import com.bank.signature.domain.model.entity.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service interface for user profile management.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
public interface UserProfileService {
    
    /**
     * Record a user login, creating or updating the profile.
     * 
     * @param keycloakId Keycloak subject ID
     * @param username Username
     * @param email Email address
     * @param fullName Full name
     * @param firstName First name
     * @param lastName Last name
     * @param roles User roles
     * @param ipAddress Login IP address
     * @return Updated user profile
     */
    UserProfile recordLogin(
        String keycloakId,
        String username,
        String email,
        String fullName,
        String firstName,
        String lastName,
        Set<String> roles,
        String ipAddress
    );
    
    /**
     * Get user profile by ID.
     */
    Optional<UserProfile> getById(UUID id);
    
    /**
     * Get user profile by Keycloak ID.
     */
    Optional<UserProfile> getByKeycloakId(String keycloakId);
    
    /**
     * Get all user profiles with pagination.
     */
    Page<UserProfile> getAll(Pageable pageable);
    
    /**
     * Get all user profiles (no pagination).
     */
    List<UserProfile> getAllUsers();
    
    /**
     * Get all active user profiles.
     */
    List<UserProfile> getAllActive();
    
    /**
     * Search user profiles.
     */
    Page<UserProfile> search(String searchTerm, Pageable pageable);
    
    /**
     * Get user statistics.
     */
    UserStats getStats();
    
    /**
     * User statistics record.
     */
    record UserStats(
        long totalUsers,
        long activeUsers,
        long adminUsers,
        long operatorUsers,
        long viewerUsers
    ) {}
}


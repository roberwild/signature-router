package com.bank.signature.application.service;

import com.bank.signature.application.dto.request.CreateUserRequest;
import com.bank.signature.application.dto.request.UpdateUserRequest;
import com.bank.signature.application.dto.response.UserResponse;

import java.util.List;

/**
 * Keycloak Admin Service
 * Story 12.5: Keycloak Users Proxy Endpoint
 * 
 * Proxy service to Keycloak Admin REST API for user management
 */
public interface KeycloakAdminService {
    
    /**
     * Get all users from Keycloak
     * 
     * @return List of users
     */
    List<UserResponse> getAllUsers();
    
    /**
     * Get single user by ID
     * 
     * @param userId Keycloak user ID
     * @return User information
     */
    UserResponse getUserById(String userId);
    
    /**
     * Create new user in Keycloak
     * 
     * @param request Create user request
     * @return Created user
     */
    UserResponse createUser(CreateUserRequest request);
    
    /**
     * Update existing user in Keycloak
     * 
     * @param userId  Keycloak user ID
     * @param request Update user request
     * @return Updated user
     */
    UserResponse updateUser(String userId, UpdateUserRequest request);
    
    /**
     * Delete user from Keycloak
     * 
     * @param userId Keycloak user ID
     */
    void deleteUser(String userId);
    
    /**
     * Update user roles in Keycloak
     * 
     * @param userId Keycloak user ID
     * @param roles  New list of roles
     */
    void updateUserRoles(String userId, List<String> roles);
}


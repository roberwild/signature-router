package com.bank.signature.domain.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Domain entity representing a user profile.
 * 
 * <p>User profiles are created/updated when users login via Keycloak.
 * The data is extracted from the JWT token claims.</p>
 * 
 * <p><b>Data Source:</b> JWT token from Keycloak (which syncs from Active Directory)</p>
 * <p><b>Persistence:</b> Stored locally for audit and display purposes</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {
    
    /**
     * Unique identifier (UUIDv7).
     */
    private UUID id;
    
    /**
     * Keycloak subject ID (sub claim from JWT).
     * This is the unique identifier from Keycloak/AD.
     */
    private String keycloakId;
    
    /**
     * Username (preferred_username claim from JWT).
     */
    private String username;
    
    /**
     * Email address (email claim from JWT).
     */
    private String email;
    
    /**
     * Full name (name claim from JWT, or given_name + family_name).
     */
    private String fullName;
    
    /**
     * First name (given_name claim from JWT).
     */
    private String firstName;
    
    /**
     * Last name (family_name claim from JWT).
     */
    private String lastName;
    
    /**
     * Roles assigned to the user (from realm_access.roles or resource_access claims).
     */
    private Set<String> roles;
    
    /**
     * Department (from AD sync, if available in JWT).
     */
    private String department;
    
    /**
     * Whether the user account is active.
     * Derived from successful recent logins.
     */
    @Builder.Default
    private boolean active = true;
    
    /**
     * Timestamp of first login (profile creation).
     */
    private Instant firstLoginAt;
    
    /**
     * Timestamp of most recent login.
     */
    private Instant lastLoginAt;
    
    /**
     * Total number of logins recorded.
     */
    @Builder.Default
    private int loginCount = 0;
    
    /**
     * IP address of last login.
     */
    private String lastLoginIp;
    
    /**
     * Record creation timestamp.
     */
    private Instant createdAt;
    
    /**
     * Record last update timestamp.
     */
    private Instant updatedAt;
    
    /**
     * Check if user has admin role.
     */
    public boolean isAdmin() {
        return roles != null && (roles.contains("admin") || roles.contains("ADMIN") || roles.contains("signature-admin"));
    }
    
    /**
     * Check if user has operator role.
     */
    public boolean isOperator() {
        return roles != null && (roles.contains("operator") || roles.contains("OPERATOR") || roles.contains("signature-operator"));
    }
    
    /**
     * Check if user has viewer role.
     */
    public boolean isViewer() {
        return roles != null && (roles.contains("viewer") || roles.contains("VIEWER") || roles.contains("signature-viewer"));
    }
    
    /**
     * Get primary role for display purposes.
     */
    public String getPrimaryRole() {
        if (isAdmin()) return "ADMIN";
        if (isOperator()) return "OPERATOR";
        if (isViewer()) return "VIEWER";
        return "USER";
    }
}


package com.bank.signature.infrastructure.adapter.outbound.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * JPA entity for user_profile table.
 * 
 * <p>Stores user profile information extracted from JWT tokens during login.</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Entity
@Table(name = "user_profile", indexes = {
    @Index(name = "idx_user_profile_keycloak_id", columnList = "keycloak_id", unique = true),
    @Index(name = "idx_user_profile_username", columnList = "username"),
    @Index(name = "idx_user_profile_email", columnList = "email"),
    @Index(name = "idx_user_profile_active", columnList = "active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileEntity {
    
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    @Column(name = "keycloak_id", nullable = false, unique = true, length = 255)
    private String keycloakId;
    
    @Column(name = "username", nullable = false, length = 255)
    private String username;
    
    @Column(name = "email", length = 255)
    private String email;
    
    @Column(name = "full_name", length = 255)
    private String fullName;
    
    @Column(name = "first_name", length = 100)
    private String firstName;
    
    @Column(name = "last_name", length = 100)
    private String lastName;
    
    /**
     * Roles stored as JSONB array.
     */
    @Type(JsonBinaryType.class)
    @Column(name = "roles", columnDefinition = "jsonb")
    @Builder.Default
    private Set<String> roles = new HashSet<>();
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
    
    @Column(name = "first_login_at")
    private Instant firstLoginAt;
    
    @Column(name = "last_login_at")
    private Instant lastLoginAt;
    
    @Column(name = "login_count", nullable = false)
    @Builder.Default
    private int loginCount = 0;
    
    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
        if (firstLoginAt == null) {
            firstLoginAt = createdAt;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}


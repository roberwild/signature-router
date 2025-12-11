package com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.mapper;

import com.singularbank.signature.routing.domain.model.entity.UserProfile;
import com.singularbank.signature.routing.infrastructure.adapter.outbound.persistence.entity.UserProfileEntity;
import org.springframework.stereotype.Component;

import java.util.HashSet;

/**
 * Mapper between UserProfile domain entity and UserProfileEntity JPA entity.
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Component
public class UserProfileEntityMapper {
    
    /**
     * Convert JPA entity to domain entity.
     */
    public UserProfile toDomain(UserProfileEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return UserProfile.builder()
            .id(entity.getId())
            .keycloakId(entity.getKeycloakId())
            .username(entity.getUsername())
            .email(entity.getEmail())
            .fullName(entity.getFullName())
            .firstName(entity.getFirstName())
            .lastName(entity.getLastName())
            .roles(entity.getRoles() != null ? new HashSet<>(entity.getRoles()) : new HashSet<>())
            .department(entity.getDepartment())
            .active(entity.isActive())
            .firstLoginAt(entity.getFirstLoginAt())
            .lastLoginAt(entity.getLastLoginAt())
            .loginCount(entity.getLoginCount())
            .lastLoginIp(entity.getLastLoginIp())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
    
    /**
     * Convert domain entity to JPA entity.
     */
    public UserProfileEntity toEntity(UserProfile domain) {
        if (domain == null) {
            return null;
        }
        
        return UserProfileEntity.builder()
            .id(domain.getId())
            .keycloakId(domain.getKeycloakId())
            .username(domain.getUsername())
            .email(domain.getEmail())
            .fullName(domain.getFullName())
            .firstName(domain.getFirstName())
            .lastName(domain.getLastName())
            .roles(domain.getRoles() != null ? new HashSet<>(domain.getRoles()) : new HashSet<>())
            .department(domain.getDepartment())
            .active(domain.isActive())
            .firstLoginAt(domain.getFirstLoginAt())
            .lastLoginAt(domain.getLastLoginAt())
            .loginCount(domain.getLoginCount())
            .lastLoginIp(domain.getLastLoginIp())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .build();
    }
}


package com.bank.signature.application.service;

import com.bank.signature.application.dto.request.CreateUserRequest;
import com.bank.signature.application.dto.request.UpdateUserRequest;
import com.bank.signature.application.dto.response.UserResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock Implementation of Keycloak Admin Service
 * Story 12.5: Keycloak Users Proxy Endpoint
 * 
 * This is a mock implementation for development/testing without real Keycloak.
 * In production, replace with KeycloakAdminServiceImpl that connects to real Keycloak Admin API.
 * 
 * Activated when: admin.portal.user-management.mode=MOCK
 */
@Service
@ConditionalOnProperty(name = "admin.portal.user-management.mode", havingValue = "MOCK", matchIfMissing = true)
@Slf4j
public class KeycloakAdminServiceMockImpl implements KeycloakAdminService {
    
    private final ConcurrentHashMap<String, UserResponse> mockUsers = new ConcurrentHashMap<>();
    
    public KeycloakAdminServiceMockImpl() {
        log.warn("🎭 Using MOCK Keycloak Admin Service (Development/Testing only)");
        log.warn("💡 Configuration: admin.portal.user-management.mode=MOCK");
        log.warn("📝 To use real Keycloak: set mode=LOCAL (full CRUD) or mode=ACTIVE_DIRECTORY (read-only)");
        initializeMockUsers();
    }
    
    /**
     * Initialize with some mock users
     */
    private void initializeMockUsers() {
        mockUsers.put("user-1", UserResponse.builder()
            .id("user-1")
            .username("admin")
            .email("admin@singularbank.com")
            .firstName("Admin")
            .lastName("User")
            .enabled(true)
            .roles(Arrays.asList("ADMIN", "OPERATOR", "VIEWER"))
            .createdAt(Instant.parse("2025-01-15T10:00:00Z"))
            .lastAccess(Instant.now().minusSeconds(5 * 60))
            .build());
        
        mockUsers.put("user-2", UserResponse.builder()
            .id("user-2")
            .username("operator1")
            .email("operator@singularbank.com")
            .firstName("María")
            .lastName("García")
            .enabled(true)
            .roles(Arrays.asList("OPERATOR", "VIEWER"))
            .createdAt(Instant.parse("2025-02-01T14:30:00Z"))
            .lastAccess(Instant.now().minusSeconds(15 * 60))
            .build());
        
        mockUsers.put("user-3", UserResponse.builder()
            .id("user-3")
            .username("viewer1")
            .email("viewer@singularbank.com")
            .firstName("Juan")
            .lastName("Pérez")
            .enabled(true)
            .roles(List.of("VIEWER"))
            .createdAt(Instant.parse("2025-03-10T09:15:00Z"))
            .lastAccess(Instant.now().minusSeconds(2 * 60 * 60))
            .build());
        
        mockUsers.put("user-4", UserResponse.builder()
            .id("user-4")
            .username("disabled_user")
            .email("disabled@singularbank.com")
            .firstName("Disabled")
            .lastName("Account")
            .enabled(false)
            .roles(List.of("VIEWER"))
            .createdAt(Instant.parse("2025-04-05T11:20:00Z"))
            .lastAccess(null)
            .build());
        
        log.info("Initialized {} mock users", mockUsers.size());
    }
    
    @Override
    public List<UserResponse> getAllUsers() {
        log.info("[MOCK] Getting all users");
        return new ArrayList<>(mockUsers.values());
    }
    
    @Override
    public UserResponse getUserById(String userId) {
        log.info("[MOCK] Getting user by ID: {}", userId);
        UserResponse user = mockUsers.get(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        return user;
    }
    
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        log.info("[MOCK] Creating user: {}", request.username());
        
        String userId = "user-" + UUID.randomUUID().toString().substring(0, 8);
        
        UserResponse newUser = UserResponse.builder()
            .id(userId)
            .username(request.username())
            .email(request.email())
            .firstName(request.firstName())
            .lastName(request.lastName())
            .enabled(true)
            .roles(request.roles() != null ? request.roles() : List.of("VIEWER"))
            .createdAt(Instant.now())
            .lastAccess(null)
            .build();
        
        mockUsers.put(userId, newUser);
        
        log.info("[MOCK] Created user: {} (id: {})", newUser.username(), userId);
        
        return newUser;
    }
    
    @Override
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        log.info("[MOCK] Updating user: {}", userId);
        
        UserResponse existing = mockUsers.get(userId);
        if (existing == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        
        UserResponse updated = UserResponse.builder()
            .id(existing.id())
            .username(existing.username())
            .email(request.email() != null ? request.email() : existing.email())
            .firstName(request.firstName() != null ? request.firstName() : existing.firstName())
            .lastName(request.lastName() != null ? request.lastName() : existing.lastName())
            .enabled(request.enabled() != null ? request.enabled() : existing.enabled())
            .roles(request.roles() != null ? request.roles() : existing.roles())
            .createdAt(existing.createdAt())
            .lastAccess(existing.lastAccess())
            .build();
        
        mockUsers.put(userId, updated);
        
        log.info("[MOCK] Updated user: {}", userId);
        
        return updated;
    }
    
    @Override
    public void deleteUser(String userId) {
        log.info("[MOCK] Deleting user: {}", userId);
        
        UserResponse removed = mockUsers.remove(userId);
        if (removed == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        
        log.info("[MOCK] Deleted user: {} ({})", removed.username(), userId);
    }
    
    @Override
    public void updateUserRoles(String userId, List<String> roles) {
        log.info("[MOCK] Updating roles for user {}: {}", userId, roles);
        
        UserResponse existing = mockUsers.get(userId);
        if (existing == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        
        UserResponse updated = UserResponse.builder()
            .id(existing.id())
            .username(existing.username())
            .email(existing.email())
            .firstName(existing.firstName())
            .lastName(existing.lastName())
            .enabled(existing.enabled())
            .roles(roles)
            .createdAt(existing.createdAt())
            .lastAccess(existing.lastAccess())
            .build();
        
        mockUsers.put(userId, updated);
        
        log.info("[MOCK] Updated roles for user: {}", userId);
    }
}


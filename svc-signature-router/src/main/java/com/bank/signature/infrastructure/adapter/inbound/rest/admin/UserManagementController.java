package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.UserProfileResponse;
import com.bank.signature.application.dto.response.UsersListResponse;
import com.bank.signature.application.service.UserProfileService;
import com.bank.signature.domain.model.entity.UserProfile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for user management (read-only).
 * 
 * <p>Users are managed via Active Directory and synced through Keycloak.
 * This controller provides read-only access to user profiles that have
 * been recorded during login events.</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "Read-only user profile management (synced from Active Directory via Keycloak)")
public class UserManagementController {
    
    private final UserProfileService userProfileService;
    
    /**
     * Get all users with pagination and optional search.
     */
    @GetMapping
    @Operation(
        summary = "Get all users",
        description = "Returns paginated list of users who have logged in. Users are synced from Active Directory via Keycloak."
    )
    public ResponseEntity<UsersListResponse> getUsers(
        @Parameter(description = "Page number (0-based)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size,
        
        @Parameter(description = "Search term (searches username, email, name)")
        @RequestParam(required = false) String search,
        
        @Parameter(description = "Sort field")
        @RequestParam(defaultValue = "lastLoginAt") String sortBy,
        
        @Parameter(description = "Sort direction")
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        log.debug("Getting users: page={}, size={}, search={}", page, size, search);
        
        Sort sort = sortDir.equalsIgnoreCase("asc") 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        
        Page<UserProfile> usersPage;
        if (search != null && !search.isBlank()) {
            usersPage = userProfileService.search(search.trim(), pageable);
        } else {
            usersPage = userProfileService.getAll(pageable);
        }
        
        var stats = userProfileService.getStats();
        
        var response = UsersListResponse.builder()
            .users(usersPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList()))
            .stats(UsersListResponse.UserStats.builder()
                .total(stats.totalUsers())
                .active(stats.activeUsers())
                .admins(stats.adminUsers())
                .operators(stats.operatorUsers())
                .viewers(stats.viewerUsers())
                .build())
            .lastSyncAt(Instant.now()) // In reality, this would be the last login event time
            .dataSource("Active Directory via Keycloak (login-based sync)")
            .pagination(UsersListResponse.PaginationInfo.builder()
                .page(usersPage.getNumber())
                .size(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .build())
            .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get a specific user by ID.
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get user by ID",
        description = "Returns a specific user profile"
    )
    public ResponseEntity<UserProfileResponse> getUser(
        @Parameter(description = "User profile ID")
        @PathVariable UUID id
    ) {
        log.debug("Getting user: {}", id);
        
        return userProfileService.getById(id)
            .map(this::toResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Convert domain entity to response DTO.
     */
    private UserProfileResponse toResponse(UserProfile profile) {
        return UserProfileResponse.builder()
            .id(profile.getId())
            .username(profile.getUsername())
            .email(profile.getEmail())
            .fullName(profile.getFullName())
            .firstName(profile.getFirstName())
            .lastName(profile.getLastName())
            .roles(profile.getRoles())
            .primaryRole(profile.getPrimaryRole())
            .department(profile.getDepartment())
            .active(profile.isActive())
            .firstLoginAt(profile.getFirstLoginAt())
            .lastLoginAt(profile.getLastLoginAt())
            .loginCount(profile.getLoginCount())
            .lastLoginIp(profile.getLastLoginIp())
            .build();
    }
}

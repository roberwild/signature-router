package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.request.CreateUserRequest;
import com.bank.signature.application.dto.request.UpdateUserRequest;
import com.bank.signature.application.dto.response.UserResponse;
import com.bank.signature.application.service.KeycloakAdminService;
import com.bank.signature.infrastructure.config.AdminPortalConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * User Management Controller
 * Story 12.5: Keycloak Users Proxy Endpoint
 * Epic 12: Frontend-Backend Admin Panel Integration
 * 
 * Provides user management endpoints that proxy to Keycloak Admin API.
 * 
 * Endpoints:
 * - GET /api/v1/admin/users - List all users
 * - GET /api/v1/admin/users/{id} - Get user by ID
 * - POST /api/v1/admin/users - Create new user
 * - PUT /api/v1/admin/users/{id} - Update user
 * - DELETE /api/v1/admin/users/{id} - Delete user
 * - PUT /api/v1/admin/users/{id}/roles - Update user roles
 * 
 * Security: ADMIN role required (user management is privileged operation)
 * 
 * @since Story 12.5
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - User Management", description = "User management via Keycloak Admin API proxy")
@SecurityRequirement(name = "bearer-jwt")
public class UserManagementController {
    
    private final KeycloakAdminService keycloakAdminService;
    private final AdminPortalConfig adminPortalConfig;
    
    /**
     * Check if write operations are allowed.
     * 
     * In read-only mode (Active Directory integration):
     * - Users are managed in AD, not via API
     * - Only GET operations allowed
     * - POST/PUT/DELETE return 403 Forbidden
     * 
     * @return true if read-only mode is enabled
     */
    private boolean isReadOnly() {
        return adminPortalConfig.getUserManagement().isReadOnly();
    }
    
    /**
     * Validate that write operations are allowed.
     * Throws exception if in read-only mode.
     */
    private void validateWriteAllowed() {
        if (isReadOnly()) {
            log.warn("Write operation attempted in read-only mode (Active Directory integration)");
            throw new IllegalStateException(
                "User management is in read-only mode. " +
                "Users are managed in Active Directory. " +
                "Contact your IT administrator to create/modify/delete users."
            );
        }
    }
    
    /**
     * List all users from Keycloak (or Active Directory via Keycloak)
     * 
     * Returns list of all users in the realm with their roles and status.
     * 
     * Active Directory Integration:
     * - If configured, returns users from AD via Keycloak User Federation
     * - Read-only: users cannot be modified via this API
     * - User management happens in Active Directory
     * 
     * Security:
     * - Requires ROLE_ADMIN (user management is privileged)
     * - HTTP 401 if not authenticated
     * - HTTP 403 if authenticated but not ADMIN
     * 
     * @return List of users
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "List all users",
        description = """
            Returns list of all users from Keycloak (or Active Directory via Keycloak User Federation).
            
            **User Information:**
            - ID, username, email
            - First name, last name
            - Enabled status
            - Assigned roles (mapped from AD groups)
            - Creation timestamp
            - Last access timestamp
            
            **Active Directory Integration:**
            - If configured, users come from AD via Keycloak User Federation
            - Roles are mapped from AD groups
            - User management happens in Active Directory (not via this API)
            
            **Configuration:**
            - Mock mode: admin.portal.user-management.mock=true
            - Read-only mode: admin.portal.user-management.read-only=true
            
            **Security:**
            - Requires ROLE_ADMIN
            - OAuth2 JWT authentication
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = UserResponse.class)),
                examples = @ExampleObject(
                    name = "Users List Example",
                    value = """
                        [
                          {
                            "id": "user-1",
                            "username": "admin",
                            "email": "admin@singularbank.com",
                            "firstName": "Admin",
                            "lastName": "User",
                            "enabled": true,
                            "roles": ["ADMIN", "OPERATOR", "VIEWER"],
                            "createdAt": "2025-01-15T10:00:00Z",
                            "lastAccess": "2025-11-30T10:00:00Z"
                          }
                        ]
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Authentication required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<List<UserResponse>> listUsers() {
        log.info("Listing all users");
        
        List<UserResponse> users = keycloakAdminService.getAllUsers();
        
        log.info("Retrieved {} users", users.size());
        
        return ResponseEntity.ok(users);
    }
    
    /**
     * Get single user by ID
     * 
     * @param id Keycloak user ID
     * @return User information
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get user by ID",
        description = "Returns detailed information for a specific user from Keycloak."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - ADMIN role required",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<UserResponse> getUser(
        @Parameter(description = "Keycloak user ID", example = "user-1")
        @PathVariable String id
    ) {
        log.info("Getting user: {}", id);
        
        try {
            UserResponse user = keycloakAdminService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Create new user in Keycloak
     * 
     * ⚠️ DISABLED in read-only mode (Active Directory integration)
     * 
     * @param request Create user request
     * @return Created user
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create new user",
        description = """
            Creates a new user in Keycloak.
            
            **⚠️ Active Directory Integration:**
            - If read-only mode is enabled (admin.portal.user-management.read-only=true),
              this endpoint will return HTTP 403.
            - Users must be created in Active Directory instead.
            - Contact your IT administrator for user creation.
            
            **Required Fields:**
            - username (unique, 3-50 chars)
            - email (valid email format)
            - firstName
            - lastName
            - password (min 8 chars)
            
            **Optional Fields:**
            - roles (default: ["VIEWER"])
            
            **Note:** Password is temporary and user should change it on first login.
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "User created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request (validation failed)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Read-only mode enabled (Active Directory integration) OR ADMIN role required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "409",
            description = "User already exists (username or email conflict)",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<?> createUser(
        @Parameter(description = "Create user request", required = true)
        @Valid @RequestBody CreateUserRequest request
    ) {
        log.info("Creating user: {}", request.username());
        
        try {
            validateWriteAllowed();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error", "Read-only mode",
                    "message", e.getMessage(),
                    "action", "Contact your IT administrator to create users in Active Directory"
                ));
        }
        
        UserResponse created = keycloakAdminService.createUser(request);
        
        log.info("User created: {} (id: {})", created.username(), created.id());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * Update existing user in Keycloak
     * 
     * ⚠️ DISABLED in read-only mode (Active Directory integration)
     * 
     * @param id      Keycloak user ID
     * @param request Update user request
     * @return Updated user
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update user",
        description = """
            Updates an existing user in Keycloak.
            
            **⚠️ Active Directory Integration:**
            - If read-only mode is enabled (admin.portal.user-management.read-only=true),
              this endpoint will return HTTP 403.
            - Users must be updated in Active Directory instead.
            - Contact your IT administrator for user updates.
            
            **Updatable Fields:**
            - email
            - firstName
            - lastName
            - enabled (true/false)
            - roles
            
            **Note:** Username cannot be changed.
            All fields are optional (only provided fields are updated).
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Read-only mode enabled (Active Directory integration) OR ADMIN role required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<?> updateUser(
        @Parameter(description = "Keycloak user ID", example = "user-1")
        @PathVariable String id,
        
        @Parameter(description = "Update user request", required = true)
        @Valid @RequestBody UpdateUserRequest request
    ) {
        log.info("Updating user: {}", id);
        
        try {
            validateWriteAllowed();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error", "Read-only mode",
                    "message", e.getMessage(),
                    "action", "Contact your IT administrator to update users in Active Directory"
                ));
        }
        
        try {
            UserResponse updated = keycloakAdminService.updateUser(id, request);
            log.info("User updated: {}", id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Delete user from Keycloak
     * 
     * ⚠️ DISABLED in read-only mode (Active Directory integration)
     * 
     * @param id Keycloak user ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete user",
        description = """
            Deletes a user from Keycloak.
            
            **⚠️ Active Directory Integration:**
            - If read-only mode is enabled (admin.portal.user-management.read-only=true),
              this endpoint will return HTTP 403.
            - Users must be deleted in Active Directory instead.
            - Contact your IT administrator for user deletion.
            
            **Warning:** This is a permanent operation and cannot be undone.
            Consider disabling the user instead (PUT /users/{id} with enabled=false).
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "User deleted successfully"
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Read-only mode enabled (Active Directory integration) OR ADMIN role required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<?> deleteUser(
        @Parameter(description = "Keycloak user ID", example = "user-1")
        @PathVariable String id
    ) {
        log.info("Deleting user: {}", id);
        
        try {
            validateWriteAllowed();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error", "Read-only mode",
                    "message", e.getMessage(),
                    "action", "Contact your IT administrator to delete users in Active Directory"
                ));
        }
        
        try {
            keycloakAdminService.deleteUser(id);
            log.info("User deleted: {}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Update user roles
     * 
     * ⚠️ DISABLED in read-only mode (Active Directory integration)
     * 
     * @param id    Keycloak user ID
     * @param roles New list of roles
     * @return No content
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update user roles",
        description = """
            Updates the roles assigned to a user in Keycloak.
            
            **⚠️ Active Directory Integration:**
            - If read-only mode is enabled (admin.portal.user-management.read-only=true),
              this endpoint will return HTTP 403.
            - Roles are managed via Active Directory groups.
            - Contact your IT administrator to change user roles (AD group membership).
            
            **Available Roles:**
            - ADMIN - Full system access (AD group: AD-SingularBank-Admins)
            - OPERATOR - Operations and monitoring (AD group: AD-SingularBank-Operators)
            - VIEWER - Read-only access (AD group: AD-SingularBank-Viewers)
            - SUPPORT - Support operations (AD group: AD-SingularBank-Support)
            
            **Note:** This replaces all existing roles with the provided list.
            """
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Roles updated successfully"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid roles",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Forbidden - Read-only mode enabled (Active Directory integration) OR ADMIN role required",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<?> updateUserRoles(
        @Parameter(description = "Keycloak user ID", example = "user-1")
        @PathVariable String id,
        
        @Parameter(
            description = "New list of roles",
            required = true,
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                    {
                      "roles": ["ADMIN", "OPERATOR"]
                    }
                    """)
            )
        )
        @RequestBody Map<String, List<String>> body
    ) {
        log.info("Updating roles for user: {}", id);
        
        try {
            validateWriteAllowed();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error", "Read-only mode",
                    "message", e.getMessage(),
                    "action", "Contact your IT administrator to change user roles (Active Directory group membership)"
                ));
        }
        
        List<String> roles = body.get("roles");
        if (roles == null || roles.isEmpty()) {
            log.warn("No roles provided for user: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            keycloakAdminService.updateUserRoles(id, roles);
            log.info("Roles updated for user: {} -> {}", id, roles);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
}


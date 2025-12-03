package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.request.CreateUserRequest;
import com.bank.signature.application.dto.request.UpdateUserRequest;
import com.bank.signature.application.dto.response.UserResponse;
import com.bank.signature.application.service.KeycloakAdminService;
import com.bank.signature.infrastructure.config.AdminPortalConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserManagementController.
 * Tests user management endpoints that proxy to Keycloak Admin API.
 *
 * Coverage:
 * - GET /api/v1/admin/users (list users)
 * - GET /api/v1/admin/users/{id} (get user)
 * - POST /api/v1/admin/users (create user)
 * - PUT /api/v1/admin/users/{id} (update user)
 * - DELETE /api/v1/admin/users/{id} (delete user)
 * - Read-only mode validation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserManagementController Tests")
class UserManagementControllerTest {

    @Mock
    private KeycloakAdminService keycloakAdminService;

    @Mock
    private AdminPortalConfig adminPortalConfig;

    @Mock
    private AdminPortalConfig.UserManagementConfig userManagementConfig;

    @InjectMocks
    private UserManagementController controller;

    private List<UserResponse> mockUsers;
    private UserResponse mockUser;
    private CreateUserRequest createRequest;
    private UpdateUserRequest updateRequest;

    @BeforeEach
    void setUp() {
        // Setup mock configuration
        when(adminPortalConfig.getUserManagement()).thenReturn(userManagementConfig);
        when(userManagementConfig.isReadOnly()).thenReturn(false); // Default: allow writes

        // Setup mock users
        mockUser = new UserResponse(
            "user-1",
            "admin",
            "admin@singularbank.com",
            "Admin",
            "User",
            true,
            List.of("ADMIN", "SUPPORT"),
            Instant.now(),
            Instant.now()
        );

        UserResponse user2 = new UserResponse(
            "user-2",
            "support",
            "support@singularbank.com",
            "Support",
            "User",
            true,
            List.of("SUPPORT"),
            Instant.now(),
            Instant.now()
        );

        mockUsers = Arrays.asList(mockUser, user2);

        // Setup create request
        createRequest = new CreateUserRequest(
            "newuser",
            "newuser@singularbank.com",
            "New",
            "User",
            "TempPassword123!",
            List.of("USER"),
            true
        );

        // Setup update request
        updateRequest = new UpdateUserRequest(
            "admin@singularbank.com",
            "Admin",
            "User",
            true
        );
    }

    @Test
    @DisplayName("Should list all users")
    void shouldListAllUsers() {
        // Given
        when(keycloakAdminService.listUsers()).thenReturn(mockUsers);

        // When
        ResponseEntity<List<UserResponse>> response = controller.listUsers();

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).username()).isEqualTo("admin");
        assertThat(response.getBody().get(1).username()).isEqualTo("support");

        verify(keycloakAdminService).listUsers();
    }

    @Test
    @DisplayName("Should get user by ID")
    void shouldGetUserById() {
        // Given
        String userId = "user-1";
        when(keycloakAdminService.getUserById(userId)).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.getUserById(userId);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo("user-1");
        assertThat(response.getBody().username()).isEqualTo("admin");
        assertThat(response.getBody().email()).isEqualTo("admin@singularbank.com");

        verify(keycloakAdminService).getUserById(userId);
    }

    @Test
    @DisplayName("Should create user when not in read-only mode")
    void shouldCreateUser_WhenNotReadOnly() {
        // Given
        when(keycloakAdminService.createUser(createRequest)).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.createUser(createRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().username()).isEqualTo("admin");

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService).createUser(createRequest);
    }

    @Test
    @DisplayName("Should throw exception when creating user in read-only mode")
    void shouldThrowException_WhenCreatingUserInReadOnlyMode() {
        // Given
        when(userManagementConfig.isReadOnly()).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> controller.createUser(createRequest))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("read-only mode")
            .hasMessageContaining("Active Directory");

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService, never()).createUser(any());
    }

    @Test
    @DisplayName("Should update user when not in read-only mode")
    void shouldUpdateUser_WhenNotReadOnly() {
        // Given
        String userId = "user-1";
        when(keycloakAdminService.updateUser(userId, updateRequest)).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.updateUser(userId, updateRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService).updateUser(userId, updateRequest);
    }

    @Test
    @DisplayName("Should throw exception when updating user in read-only mode")
    void shouldThrowException_WhenUpdatingUserInReadOnlyMode() {
        // Given
        String userId = "user-1";
        when(userManagementConfig.isReadOnly()).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> controller.updateUser(userId, updateRequest))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("read-only mode");

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService, never()).updateUser(anyString(), any());
    }

    @Test
    @DisplayName("Should delete user when not in read-only mode")
    void shouldDeleteUser_WhenNotReadOnly() {
        // Given
        String userId = "user-1";
        doNothing().when(keycloakAdminService).deleteUser(userId);

        // When
        ResponseEntity<Void> response = controller.deleteUser(userId);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService).deleteUser(userId);
    }

    @Test
    @DisplayName("Should throw exception when deleting user in read-only mode")
    void shouldThrowException_WhenDeletingUserInReadOnlyMode() {
        // Given
        String userId = "user-1";
        when(userManagementConfig.isReadOnly()).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> controller.deleteUser(userId))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("read-only mode");

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService, never()).deleteUser(anyString());
    }

    @Test
    @DisplayName("Should update user roles when not in read-only mode")
    void shouldUpdateUserRoles_WhenNotReadOnly() {
        // Given
        String userId = "user-1";
        List<String> roles = List.of("ADMIN", "SUPPORT", "AUDITOR");
        when(keycloakAdminService.updateUserRoles(userId, roles)).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.updateUserRoles(userId, roles);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService).updateUserRoles(userId, roles);
    }

    @Test
    @DisplayName("Should throw exception when updating roles in read-only mode")
    void shouldThrowException_WhenUpdatingRolesInReadOnlyMode() {
        // Given
        String userId = "user-1";
        List<String> roles = List.of("ADMIN");
        when(userManagementConfig.isReadOnly()).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> controller.updateUserRoles(userId, roles))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("read-only mode");

        verify(userManagementConfig).isReadOnly();
        verify(keycloakAdminService, never()).updateUserRoles(anyString, any());
    }

    @Test
    @DisplayName("Should allow GET operations in read-only mode")
    void shouldAllowGetOperations_InReadOnlyMode() {
        // Given
        when(userManagementConfig.isReadOnly()).thenReturn(true);
        when(keycloakAdminService.listUsers()).thenReturn(mockUsers);
        when(keycloakAdminService.getUserById("user-1")).thenReturn(mockUser);

        // When
        ResponseEntity<List<UserResponse>> listResponse = controller.listUsers();
        ResponseEntity<UserResponse> getResponse = controller.getUserById("user-1");

        // Then
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        verify(keycloakAdminService).listUsers();
        verify(keycloakAdminService).getUserById("user-1");
    }

    @Test
    @DisplayName("Should return empty list when no users exist")
    void shouldReturnEmptyList_WhenNoUsers() {
        // Given
        when(keycloakAdminService.listUsers()).thenReturn(List.of());

        // When
        ResponseEntity<List<UserResponse>> response = controller.listUsers();

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();

        verify(keycloakAdminService).listUsers();
    }

    @Test
    @DisplayName("Should include user roles in response")
    void shouldIncludeUserRoles() {
        // Given
        when(keycloakAdminService.getUserById("user-1")).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.getUserById("user-1");

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().roles()).containsExactly("ADMIN", "SUPPORT");
    }

    @Test
    @DisplayName("Should include user timestamps in response")
    void shouldIncludeUserTimestamps() {
        // Given
        when(keycloakAdminService.getUserById("user-1")).thenReturn(mockUser);

        // When
        ResponseEntity<UserResponse> response = controller.getUserById("user-1");

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().createdAt()).isNotNull();
        assertThat(response.getBody().lastAccess()).isNotNull();
    }
}

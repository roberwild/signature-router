package com.singularbank.signature.routing.infrastructure.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Admin Portal Configuration
 * 
 * Centralizes configuration for Admin Portal features with multiple user source modes:
 * - LOCAL: Users managed in Keycloak (local database) - CRUD completo
 * - ACTIVE_DIRECTORY: Users from AD (read-only federation) - Solo lectura
 * - MOCK: Mock users for development/testing - CRUD completo en memoria
 * 
 * @since Epic 12
 */
@Configuration
@ConfigurationProperties(prefix = "admin.portal")
@Getter
public class AdminPortalConfig {
    
    /**
     * User Management Configuration
     */
    private final UserManagement userManagement = new UserManagement();
    
    @Getter
    public static class UserManagement {
        
        /**
         * User source mode - determines where users come from and access level.
         * 
         * Modes:
         * - LOCAL: Users stored in Keycloak database
         *   - Full CRUD operations allowed
         *   - Users created/managed via API
         *   - Use case: Standalone installations, test environments
         * 
         * - ACTIVE_DIRECTORY: Users federated from Active Directory
         *   - READ ONLY access (GET endpoints only)
         *   - POST/PUT/DELETE return 403
         *   - Users managed in Active Directory
         *   - Use case: Enterprise deployments with existing AD
         * 
         * - MOCK: Mock users in memory (development only)
         *   - Full CRUD operations (in-memory only)
         *   - No Keycloak connection required
         *   - Use case: Development, demos, testing
         * 
         * Default: MOCK (for development)
         */
        private UserSourceMode mode = UserSourceMode.MOCK;
        
        public void setMode(UserSourceMode mode) {
            this.mode = mode;
        }
        
        /**
         * Check if write operations are allowed based on current mode.
         * 
         * @return true if POST/PUT/DELETE operations are allowed
         */
        public boolean isWriteAllowed() {
            return mode != UserSourceMode.ACTIVE_DIRECTORY;
        }
        
        /**
         * Check if read-only mode is active.
         * 
         * @return true if only GET operations are allowed
         */
        public boolean isReadOnly() {
            return mode == UserSourceMode.ACTIVE_DIRECTORY;
        }
        
        /**
         * Check if mock mode is active.
         * 
         * @return true if using mock implementation
         */
        public boolean isMock() {
            return mode == UserSourceMode.MOCK;
        }
    }
    
    /**
     * User Source Mode Enum
     */
    public enum UserSourceMode {
        /**
         * Users managed locally in Keycloak database.
         * Full CRUD operations allowed.
         */
        LOCAL,
        
        /**
         * Users federated from Active Directory.
         * Read-only access (GET only).
         */
        ACTIVE_DIRECTORY,
        
        /**
         * Mock users in memory for development.
         * Full CRUD operations (in-memory only).
         */
        MOCK
    }
}


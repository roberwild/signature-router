package com.singularbank.signature.routing.domain.security;

/**
 * Banking roles for Role-Based Access Control (RBAC).
 * 
 * <p>Roles are extracted from Keycloak JWT tokens ({@code realm_access.roles})
 * and mapped to Spring Security authorities with {@code ROLE_} prefix.</p>
 * 
 * <h3>Role Hierarchy (from highest to lowest privileges):</h3>
 * <ol>
 *   <li><b>ADMIN</b>: Full system access (create, read, update, delete)</li>
 *   <li><b>SUPPORT</b>: Operational support (create requests, manage routing rules)</li>
 *   <li><b>AUDITOR</b>: Read-only access to audit logs and system health</li>
 *   <li><b>USER</b>: Basic access (create and query own signature requests)</li>
 * </ol>
 * 
 * <h3>Permission Matrix:</h3>
 * <table border="1">
 *   <tr>
 *     <th>Action</th>
 *     <th>ADMIN</th>
 *     <th>SUPPORT</th>
 *     <th>AUDITOR</th>
 *     <th>USER</th>
 *   </tr>
 *   <tr>
 *     <td>Create Signature Request</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>✅ (own only)</td>
 *   </tr>
 *   <tr>
 *     <td>Query Any Signature Request</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>Query Own Signature Request</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>✅</td>
 *   </tr>
 *   <tr>
 *     <td>Create/Update Routing Rule</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>Delete Routing Rule</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>View Audit Logs</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>✅ (read-only)</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>View Provider Health</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>✅ (read-only)</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>Manage Vault Secrets</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *   </tr>
 *   <tr>
 *     <td>Abort Signature Request</td>
 *     <td>✅</td>
 *     <td>✅</td>
 *     <td>❌</td>
 *     <td>❌</td>
 *   </tr>
 * </table>
 * 
 * <h3>Usage in Controllers:</h3>
 * <pre>{@code
 * @PreAuthorize("hasRole('ADMIN')")
 * public void deleteRoutingRule(UUID id) { ... }
 * 
 * @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
 * public void createRoutingRule(RuleDto dto) { ... }
 * 
 * @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
 * public List<AuditLog> getAuditLogs() { ... }
 * }</pre>
 * 
 * <h3>Compliance:</h3>
 * <ul>
 *   <li><b>PCI-DSS v4.0</b> - Req 7: Restrict access by business need-to-know</li>
 *   <li><b>GDPR</b> - Art. 32: Access control measures</li>
 *   <li><b>SOC 2</b> - CC6.3: Logical access controls based on roles</li>
 * </ul>
 * 
 * @see org.springframework.security.access.prepost.PreAuthorize
 * @see com.singularbank.signature.routing.infrastructure.security.KeycloakJwtAuthenticationConverter
 * @since Story 8.2
 */
public enum Role {
    
    /**
     * <b>Administrator</b> - Full system access.
     * 
     * <p><b>Permissions:</b></p>
     * <ul>
     *   <li>All CRUD operations on all resources</li>
     *   <li>Manage routing rules (create, update, delete)</li>
     *   <li>View and manage Vault secrets</li>
     *   <li>Access all audit logs</li>
     *   <li>Manage system configuration</li>
     *   <li>Create signature requests for any customer</li>
     *   <li>Abort any signature request</li>
     * </ul>
     * 
     * <p><b>Typical Users:</b> System administrators, DevOps team</p>
     */
    ADMIN("ADMIN", "Administrator - Full system access"),
    
    /**
     * <b>Support Engineer</b> - Operational support access.
     * 
     * <p><b>Permissions:</b></p>
     * <ul>
     *   <li>Create signature requests for customers</li>
     *   <li>Query signature request status and timelines</li>
     *   <li>Create and update routing rules (NOT delete)</li>
     *   <li>View provider health status</li>
     *   <li>Abort signature requests (customer support)</li>
     * </ul>
     * 
     * <p><b>Restrictions:</b></p>
     * <ul>
     *   <li>Cannot delete routing rules</li>
     *   <li>Cannot access audit logs</li>
     *   <li>Cannot manage Vault secrets</li>
     * </ul>
     * 
     * <p><b>Typical Users:</b> Customer support team, operations team</p>
     */
    SUPPORT("SUPPORT", "Support Engineer - Operational support"),
    
    /**
     * <b>Auditor</b> - Read-only compliance and audit access.
     * 
     * <p><b>Permissions:</b></p>
     * <ul>
     *   <li>View all audit logs (immutable)</li>
     *   <li>View routing rules (read-only)</li>
     *   <li>View provider health status (read-only)</li>
     *   <li>Generate compliance reports</li>
     * </ul>
     * 
     * <p><b>Restrictions:</b></p>
     * <ul>
     *   <li>Cannot create, update, or delete any resources</li>
     *   <li>Cannot create signature requests</li>
     *   <li>Cannot modify system configuration</li>
     * </ul>
     * 
     * <p><b>Typical Users:</b> Compliance team, internal auditors, external auditors</p>
     */
    AUDITOR("AUDITOR", "Auditor - Read-only audit access"),
    
    /**
     * <b>End User</b> - Basic customer-facing access.
     * 
     * <p><b>Permissions:</b></p>
     * <ul>
     *   <li>Create signature requests for own customer ID</li>
     *   <li>Query own signature request status</li>
     *   <li>Complete own signature challenges</li>
     * </ul>
     * 
     * <p><b>Restrictions:</b></p>
     * <ul>
     *   <li>Cannot query other customers' signature requests</li>
     *   <li>Cannot access routing rules</li>
     *   <li>Cannot access audit logs</li>
     *   <li>Cannot access provider health</li>
     *   <li>Cannot abort signature requests</li>
     * </ul>
     * 
     * <p><b>Typical Users:</b> Mobile app, web portal (customer-facing applications)</p>
     */
    USER("USER", "End User - Basic customer-facing access");
    
    private final String roleName;
    private final String description;
    
    Role(String roleName, String description) {
        this.roleName = roleName;
        this.description = description;
    }
    
    /**
     * Get the role name (matches Keycloak role name).
     * 
     * @return role name (e.g., "ADMIN", "SUPPORT")
     */
    public String getRoleName() {
        return roleName;
    }
    
    /**
     * Get human-readable description of the role.
     * 
     * @return role description
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Get Spring Security authority string (with ROLE_ prefix).
     * 
     * <p>Example: {@code Role.ADMIN.getAuthority()} returns {@code "ROLE_ADMIN"}</p>
     * 
     * @return Spring Security authority (e.g., "ROLE_ADMIN")
     */
    public String getAuthority() {
        return "ROLE_" + roleName;
    }
    
    /**
     * Check if this role has higher or equal privileges than another role.
     * 
     * <p>Role hierarchy: ADMIN > SUPPORT > AUDITOR > USER</p>
     * 
     * @param other the role to compare against
     * @return true if this role has higher or equal privileges
     */
    public boolean hasPrivilegeLevel(Role other) {
        return this.ordinal() <= other.ordinal();
    }
    
    /**
     * Parse role from string (case-insensitive).
     * 
     * @param roleName role name (e.g., "admin", "ADMIN", "Admin")
     * @return Role enum
     * @throws IllegalArgumentException if role name is invalid
     */
    public static Role fromString(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("Role name cannot be null or blank");
        }
        
        String normalized = roleName.toUpperCase().trim();
        // Remove ROLE_ prefix if present
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        
        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + roleName + ". Valid roles: ADMIN, SUPPORT, AUDITOR, USER");
        }
    }
    
    @Override
    public String toString() {
        return roleName;
    }
}


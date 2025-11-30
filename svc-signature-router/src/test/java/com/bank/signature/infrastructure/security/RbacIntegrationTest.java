package com.bank.signature.infrastructure.security;

import com.bank.signature.infrastructure.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for RBAC (Role-Based Access Control).
 * Story 8.2: RBAC - Role-Based Access Control
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>AC1: ADMIN can access all endpoints</li>
 *   <li>AC2: SUPPORT can read and modify (excluding delete)</li>
 *   <li>AC3: AUDITOR can only read (no write operations)</li>
 *   <li>AC4: USER can access user-facing endpoints only</li>
 *   <li>AC5: Unauthorized roles get HTTP 403 Forbidden</li>
 *   <li>AC6: Access denied events are logged (see CustomAccessDeniedHandler)</li>
 * </ul>
 * 
 * @since Story 8.2
 */
@WebMvcTest(controllers = RbacIntegrationTest.TestRbacController.class)
@Import({SecurityConfig.class, KeycloakJwtAuthenticationConverter.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("test")
public class RbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Test controller with RBAC annotations for integration testing.
     */
    @RestController
    @RequestMapping("/api/v1/test")
    static class TestRbacController {

        @GetMapping("/admin-only")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
        public String adminOnly() {
            return "Admin OK";
        }

        @PostMapping("/admin-support")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
        public String adminSupport() {
            return "Admin/Support OK";
        }

        @GetMapping("/read-only")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SUPPORT')")
        public String readOnly() {
            return "Read OK";
        }

        @GetMapping("/user-endpoint")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT', 'USER')")
        public String userEndpoint() {
            return "User OK";
        }
    }

    // ============================
    // AC1: ADMIN role tests
    // ============================

    @Test
    @DisplayName("AC1: ADMIN can access admin-only endpoint")
    void testAdminCanAccessAdminOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC1: ADMIN can access admin-support endpoint")
    void testAdminCanAccessAdminSupport() throws Exception {
        mockMvc.perform(post("/api/v1/test/admin-support")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC1: ADMIN can access read-only endpoint")
    void testAdminCanAccessReadOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/read-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    // ============================
    // AC2: SUPPORT role tests
    // ============================

    @Test
    @DisplayName("AC2: SUPPORT can access admin-support endpoint")
    void testSupportCanAccessAdminSupport() throws Exception {
        mockMvc.perform(post("/api/v1/test/admin-support")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPPORT"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC2: SUPPORT can access read-only endpoint")
    void testSupportCanAccessReadOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/read-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPPORT"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC5: SUPPORT CANNOT access admin-only endpoint")
    void testSupportCannotAccessAdminOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPPORT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    // ============================
    // AC3: AUDITOR role tests
    // ============================

    @Test
    @DisplayName("AC3: AUDITOR can access read-only endpoint")
    void testAuditorCanAccessReadOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/read-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AUDITOR"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC5: AUDITOR CANNOT access admin-support endpoint (write operation)")
    void testAuditorCannotAccessAdminSupport() throws Exception {
        mockMvc.perform(post("/api/v1/test/admin-support")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AUDITOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("AC5: AUDITOR CANNOT access admin-only endpoint")
    void testAuditorCannotAccessAdminOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_AUDITOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    // ============================
    // AC4: USER role tests
    // ============================

    @Test
    @DisplayName("AC4: USER can access user-endpoint")
    void testUserCanAccessUserEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/user-endpoint")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("AC5: USER CANNOT access admin-only endpoint")
    void testUserCannotAccessAdminOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("AC5: USER CANNOT access admin-support endpoint")
    void testUserCannotAccessAdminSupport() throws Exception {
        mockMvc.perform(post("/api/v1/test/admin-support")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("AC5: USER CANNOT access read-only endpoint (reserved for staff)")
    void testUserCannotAccessReadOnly() throws Exception {
        mockMvc.perform(get("/api/v1/test/read-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    // ============================
    // AC5: Unauthorized role tests
    // ============================

    @Test
    @DisplayName("AC5: Unauthenticated request returns HTTP 401")
    void testUnauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("AC5: Unknown role returns HTTP 403 Forbidden")
    void testUnknownRoleReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin-only")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_UNKNOWN"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}


package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.exception.SecretRotationException;
import com.bank.signature.domain.port.outbound.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for VaultSecretRotationServiceImpl.
 * Story 8.5: Vault Secret Rotation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VaultSecretRotationServiceImpl Tests")
class VaultSecretRotationServiceImplTest {
    
    @Mock
    private VaultTemplate vaultTemplate;
    
    @Mock
    private AuditService auditService;
    
    @Mock
    private CacheManager cacheManager;
    
    @Mock
    private ContextRefresher contextRefresher;
    
    private VaultSecretRotationServiceImpl service;
    
    private static final String PSEUDO_KEY_PATH = "secret/signature-router/pseudonymization-key";
    private static final String OLD_KEY = "old_key_123456789abcdef";
    private static final String NEW_KEY = "new_key_123456789abcdef";
    
    @BeforeEach
    void setUp() {
        service = new VaultSecretRotationServiceImpl(
            vaultTemplate,
            auditService,
            cacheManager,
            contextRefresher
        );
    }
    
    @Test
    @DisplayName("Should successfully rotate pseudonymization key")
    void shouldRotatePseudonymizationKey() {
        // Given: Existing key in Vault
        VaultResponse oldResponse = createVaultResponse(OLD_KEY);
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenReturn(oldResponse);
        
        // And: Cache exists
        ConcurrentMapCache cache = new ConcurrentMapCache("pseudonymization-keys");
        cache.put("hmac-key", OLD_KEY);
        when(cacheManager.getCache("pseudonymization-keys")).thenReturn(cache);
        
        // When: Rotate key
        service.rotatePseudonymizationKey();
        
        // Then: New key is written to Vault
        ArgumentCaptor<Map<String, Object>> dataCaptor = ArgumentCaptor.forClass(Map.class);
        verify(vaultTemplate).write(eq(PSEUDO_KEY_PATH), dataCaptor.capture());
        
        Map<String, Object> writtenData = dataCaptor.getValue();
        assertThat(writtenData).containsKeys("key", "created_at", "rotation_period", "grace_period");
        assertThat(writtenData.get("key")).isNotEqualTo(OLD_KEY);
        
        // And: Cache is evicted
        assertThat(cache.get("hmac-key")).isNull();
        
        // And: Context is refreshed
        verify(contextRefresher).refresh();
        
        // And: Audit log is created
        verify(auditService).log(any());
    }
    
    @Test
    @DisplayName("Should handle vault read failure gracefully")
    void shouldHandleVaultReadFailure() {
        // Given: Vault read fails
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenThrow(new RuntimeException("Vault unavailable"));
        
        // When/Then: Exception is thrown
        assertThatThrownBy(() -> service.rotatePseudonymizationKey())
            .isInstanceOf(SecretRotationException.class)
            .hasMessageContaining("Failed to rotate pseudonymization key");
        
        // And: Failure is audited
        verify(auditService).log(any());
    }
    
    @Test
    @DisplayName("Should handle vault write failure gracefully")
    void shouldHandleVaultWriteFailure() {
        // Given: Vault read succeeds but write fails
        VaultResponse oldResponse = createVaultResponse(OLD_KEY);
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenReturn(oldResponse);
        doThrow(new RuntimeException("Vault write failed")).when(vaultTemplate).write(eq(PSEUDO_KEY_PATH), any());
        
        // When/Then: Exception is thrown
        assertThatThrownBy(() -> service.rotatePseudonymizationKey())
            .isInstanceOf(SecretRotationException.class)
            .hasMessageContaining("Failed to rotate pseudonymization key");
        
        // And: Failure is audited
        verify(auditService, atLeastOnce()).log(any());
    }
    
    @Test
    @DisplayName("Should verify rotation successfully")
    void shouldVerifyRotation() {
        // Given: Valid key in Vault
        VaultResponse response = createVaultResponseWithMetadata(NEW_KEY);
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenReturn(response);
        
        // When: Verify rotation
        boolean result = service.verifyRotation();
        
        // Then: Verification passes
        assertThat(result).isTrue();
    }
    
    @Test
    @DisplayName("Should fail verification if key is missing")
    void shouldFailVerificationIfKeyMissing() {
        // Given: No key in Vault
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenReturn(null);
        
        // When: Verify rotation
        boolean result = service.verifyRotation();
        
        // Then: Verification fails
        assertThat(result).isFalse();
    }
    
    @Test
    @DisplayName("Should fail verification if key is empty")
    void shouldFailVerificationIfKeyEmpty() {
        // Given: Empty key in Vault
        VaultResponse response = createVaultResponse("");
        when(vaultTemplate.read(PSEUDO_KEY_PATH)).thenReturn(response);
        
        // When: Verify rotation
        boolean result = service.verifyRotation();
        
        // Then: Verification fails
        assertThat(result).isFalse();
    }
    
    @Test
    @DisplayName("Should rotate database credentials (managed by Vault)")
    void shouldRotateDatabaseCredentials() {
        // When: Rotate database credentials
        service.rotateDatabaseCredentials();
        
        // Then: Only audit log is created (rotation is managed by Vault)
        verify(auditService).log(any());
    }
    
    /**
     * Helper method to create VaultResponse with key only.
     */
    private VaultResponse createVaultResponse(String key) {
        Map<String, Object> data = new HashMap<>();
        data.put("key", key);
        
        VaultResponse response = new VaultResponse();
        response.setData(data);
        return response;
    }
    
    /**
     * Helper method to create VaultResponse with key and metadata.
     */
    private VaultResponse createVaultResponseWithMetadata(String key) {
        Map<String, Object> data = new HashMap<>();
        data.put("key", key);
        data.put("created_at", "2025-11-29T00:00:00Z");
        data.put("rotation_period", "90d");
        data.put("grace_period", "7d");
        data.put("algorithm", "HMAC-SHA256");
        
        VaultResponse response = new VaultResponse();
        response.setData(data);
        return response;
    }
}


package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.exception.PseudonymizationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.vault.core.VaultTemplate;
import org.springframework.vault.support.VaultResponse;
import org.springframework.vault.support.VaultResponseSupport;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link VaultPseudonymizationServiceImpl}.
 * Story 8.3: Pseudonymization Service
 * 
 * <p>Tests validate:
 * <ul>
 *   <li>AC1: HMAC-SHA256 produces 64-character hex string</li>
 *   <li>AC2: Deterministic (same input → same output)</li>
 *   <li>AC3: Verify method validates correctly</li>
 *   <li>AC4: Error handling for Vault failures</li>
 *   <li>AC5: Input validation (null/blank checks)</li>
 * </ul>
 * 
 * @since Story 8.3
 */
@ExtendWith(MockitoExtension.class)
public class VaultPseudonymizationServiceImplTest {

    @Mock
    private VaultTemplate vaultTemplate;

    private VaultPseudonymizationServiceImpl service;

    private static final String TEST_SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 256-bit hex

    @BeforeEach
    void setUp() {
        service = new VaultPseudonymizationServiceImpl(vaultTemplate);
        
        // Mock Vault response with test secret key
        VaultResponse mockResponse = mock(VaultResponse.class);
        Map<String, Object> data = new HashMap<>();
        data.put("key", TEST_SECRET_KEY);
        when(mockResponse.getData()).thenReturn(data);
        when(vaultTemplate.read(anyString())).thenReturn(mockResponse);
    }

    @Test
    @DisplayName("AC1: Should produce 64-character hex string (SHA-256 = 256 bits = 64 hex chars)")
    void shouldProduce64CharHexString() {
        String customerId = "CUST_123456";
        
        String pseudonymized = service.pseudonymize(customerId);
        
        assertThat(pseudonymized)
                .hasSize(64)
                .matches("^[0-9a-f]{64}$"); // Only hex chars (lowercase)
    }

    @Test
    @DisplayName("AC2: Should be deterministic (same input → same output)")
    void shouldBeDeterministic() {
        String customerId = "CUST_987654321";
        
        String hash1 = service.pseudonymize(customerId);
        String hash2 = service.pseudonymize(customerId);
        String hash3 = service.pseudonymize(customerId);
        
        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash2).isEqualTo(hash3);
    }

    @Test
    @DisplayName("AC2: Different inputs should produce different outputs")
    void differentInputsShouldProduceDifferentOutputs() {
        String customerId1 = "CUST_111111";
        String customerId2 = "CUST_222222";
        
        String hash1 = service.pseudonymize(customerId1);
        String hash2 = service.pseudonymize(customerId2);
        
        assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("AC3: verify() should return true for matching customer ID")
    void verifyShouldReturnTrueForMatchingCustomerId() {
        String customerId = "CUST_ABCDEF";
        String pseudonymized = service.pseudonymize(customerId);
        
        boolean result = service.verify(customerId, pseudonymized);
        
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("AC3: verify() should return false for non-matching customer ID")
    void verifyShouldReturnFalseForNonMatchingCustomerId() {
        String customerId1 = "CUST_111111";
        String customerId2 = "CUST_222222";
        String pseudonymized1 = service.pseudonymize(customerId1);
        
        boolean result = service.verify(customerId2, pseudonymized1);
        
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("AC5: Should throw IllegalArgumentException for null customer ID in pseudonymize()")
    void shouldThrowExceptionForNullCustomerIdInPseudonymize() {
        assertThatThrownBy(() -> service.pseudonymize(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Customer ID cannot be null or blank");
    }

    @Test
    @DisplayName("AC5: Should throw IllegalArgumentException for blank customer ID in pseudonymize()")
    void shouldThrowExceptionForBlankCustomerIdInPseudonymize() {
        assertThatThrownBy(() -> service.pseudonymize("   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Customer ID cannot be null or blank");
    }

    @Test
    @DisplayName("AC5: Should throw IllegalArgumentException for null customer ID in verify()")
    void shouldThrowExceptionForNullCustomerIdInVerify() {
        String pseudonymized = "a".repeat(64);
        
        assertThatThrownBy(() -> service.verify(null, pseudonymized))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Customer ID cannot be null or blank");
    }

    @Test
    @DisplayName("AC5: Should throw IllegalArgumentException for null pseudonymized ID in verify()")
    void shouldThrowExceptionForNullPseudonymizedIdInVerify() {
        String customerId = "CUST_123";
        
        assertThatThrownBy(() -> service.verify(customerId, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Pseudonymized ID cannot be null or blank");
    }

    @Test
    @DisplayName("AC4: Should throw PseudonymizationException when Vault returns null response")
    void shouldThrowExceptionWhenVaultReturnsNull() {
        when(vaultTemplate.read(anyString())).thenReturn(null);
        
        VaultPseudonymizationServiceImpl freshService = new VaultPseudonymizationServiceImpl(vaultTemplate);
        
        assertThatThrownBy(() -> freshService.pseudonymize("CUST_123"))
                .isInstanceOf(PseudonymizationException.class)
                .hasMessageContaining("Vault secret not found");
    }

    @Test
    @DisplayName("AC4: Should throw PseudonymizationException when Vault secret field is missing")
    void shouldThrowExceptionWhenVaultSecretFieldMissing() {
        VaultResponse mockResponse = mock(VaultResponse.class);
        Map<String, Object> emptyData = new HashMap<>();
        when(mockResponse.getData()).thenReturn(emptyData);
        when(vaultTemplate.read(anyString())).thenReturn(mockResponse);
        
        VaultPseudonymizationServiceImpl freshService = new VaultPseudonymizationServiceImpl(vaultTemplate);
        
        assertThatThrownBy(() -> freshService.pseudonymize("CUST_123"))
                .isInstanceOf(PseudonymizationException.class)
                .hasMessageContaining("Vault secret field 'key' not found");
    }

    @Test
    @DisplayName("AC4: Should throw PseudonymizationException when Vault throws exception")
    void shouldThrowExceptionWhenVaultThrowsException() {
        when(vaultTemplate.read(anyString())).thenThrow(new RuntimeException("Vault connection failed"));
        
        VaultPseudonymizationServiceImpl freshService = new VaultPseudonymizationServiceImpl(vaultTemplate);
        
        assertThatThrownBy(() -> freshService.pseudonymize("CUST_123"))
                .isInstanceOf(PseudonymizationException.class)
                .hasMessageContaining("Failed to retrieve secret key from Vault");
    }

    @Test
    @DisplayName("Should handle edge case: very long customer ID")
    void shouldHandleVeryLongCustomerId() {
        String longCustomerId = "CUST_" + "A".repeat(1000);
        
        String pseudonymized = service.pseudonymize(longCustomerId);
        
        assertThat(pseudonymized)
                .hasSize(64)
                .matches("^[0-9a-f]{64}$");
    }

    @Test
    @DisplayName("Should handle edge case: customer ID with special characters")
    void shouldHandleCustomerIdWithSpecialCharacters() {
        String customerId = "CUST_@#$%^&*()_+-=[]{}|;':\",./<>?";
        
        String pseudonymized = service.pseudonymize(customerId);
        
        assertThat(pseudonymized)
                .hasSize(64)
                .matches("^[0-9a-f]{64}$");
    }

    @Test
    @DisplayName("Should handle edge case: customer ID with Unicode characters")
    void shouldHandleCustomerIdWithUnicodeCharacters() {
        String customerId = "CUST_日本語_中文_한국어";
        
        String pseudonymized = service.pseudonymize(customerId);
        
        assertThat(pseudonymized)
                .hasSize(64)
                .matches("^[0-9a-f]{64}$");
    }

    @Test
    @DisplayName("Should cache Vault secret key (verify single Vault call for multiple pseudonymizations)")
    void shouldCacheVaultSecretKey() {
        // First call
        service.pseudonymize("CUST_1");
        // Second call (should use cached key)
        service.pseudonymize("CUST_2");
        // Third call (should use cached key)
        service.pseudonymize("CUST_3");
        
        // Vault should only be called once (cached)
        verify(vaultTemplate, times(1)).read(anyString());
    }
}


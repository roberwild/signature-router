package com.bank.signature.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for HashService.
 * Story 10.5: Idempotency Functional
 */
@DisplayName("HashService Tests")
class HashServiceTest {
    
    private HashService hashService;
    
    @BeforeEach
    void setUp() {
        hashService = new HashService(new ObjectMapper());
    }
    
    @Test
    @DisplayName("Should generate same hash for same object")
    void shouldGenerateSameHashForSameObject() {
        // Given
        TestObject obj1 = new TestObject("test", 123);
        TestObject obj2 = new TestObject("test", 123);
        
        // When
        String hash1 = hashService.sha256(obj1);
        String hash2 = hashService.sha256(obj2);
        
        // Then
        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).hasSize(64); // SHA-256 produces 64 hex characters
    }
    
    @Test
    @DisplayName("Should generate different hash for different objects")
    void shouldGenerateDifferentHashForDifferentObjects() {
        // Given
        TestObject obj1 = new TestObject("test", 123);
        TestObject obj2 = new TestObject("test", 456);
        
        // When
        String hash1 = hashService.sha256(obj1);
        String hash2 = hashService.sha256(obj2);
        
        // Then
        assertThat(hash1).isNotEqualTo(hash2);
    }
    
    @Test
    @DisplayName("Should generate hash for string")
    void shouldGenerateHashForString() {
        // Given
        String input = "test-string";
        
        // When
        String hash = hashService.sha256(input);
        
        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64);
    }
    
    @Test
    @DisplayName("Should generate hash for empty object")
    void shouldGenerateHashForEmptyObject() {
        // Given
        TestObject empty = new TestObject(null, null);
        
        // When
        String hash = hashService.sha256(empty);
        
        // Then
        assertThat(hash).isNotNull();
        assertThat(hash).hasSize(64);
    }
    
    @Test
    @DisplayName("Should throw exception for null input")
    void shouldThrowExceptionForNullInput() {
        // When/Then
        assertThatThrownBy(() -> hashService.sha256(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be null");
    }
    
    @Test
    @DisplayName("Should generate consistent hash regardless of object order")
    void shouldGenerateConsistentHash() {
        // Given - same data, different instances
        TestObject obj1 = new TestObject("value1", 100);
        TestObject obj2 = new TestObject("value1", 100);
        
        // When
        String hash1 = hashService.sha256(obj1);
        String hash2 = hashService.sha256(obj2);
        
        // Then - should be identical
        assertThat(hash1).isEqualTo(hash2);
    }
    
    // Test helper class
    record TestObject(String name, Integer value) {}
}


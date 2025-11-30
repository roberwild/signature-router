package com.bank.signature.application.service;

import com.bank.signature.domain.exception.IdempotencyKeyConflictException;
import com.bank.signature.domain.model.entity.IdempotencyRecord;
import com.bank.signature.domain.port.outbound.IdempotencyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for IdempotencyService.
 * Story 10.5: Idempotency Functional
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("IdempotencyService Tests")
class IdempotencyServiceTest {
    
    @Mock
    private IdempotencyRepository repository;
    
    @InjectMocks
    private IdempotencyService idempotencyService;
    
    private String idempotencyKey;
    private String requestHash;
    private IdempotencyRecord existingRecord;
    
    @BeforeEach
    void setUp() {
        idempotencyKey = "test-key-123";
        requestHash = "abc123def456";
        
        existingRecord = IdempotencyRecord.builder()
            .id(UUID.randomUUID())
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(201)
            .responseBody("{\"id\":\"123\"}")
            .createdAt(Instant.now().minusSeconds(3600))
            .expiresAt(Instant.now().plusSeconds(23 * 3600)) // 23 hours from now
            .build();
    }
    
    @Test
    @DisplayName("Should return empty when key does not exist")
    void shouldReturnEmptyWhenKeyDoesNotExist() {
        // Given
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.empty());
        
        // When
        Optional<IdempotencyRecord> result = idempotencyService.checkAndStore(idempotencyKey, requestHash);
        
        // Then
        assertThat(result).isEmpty();
        verify(repository).findByKey(idempotencyKey);
    }
    
    @Test
    @DisplayName("Should return cached record when key exists and hash matches")
    void shouldReturnCachedRecordWhenKeyExistsAndHashMatches() {
        // Given
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.of(existingRecord));
        
        // When
        Optional<IdempotencyRecord> result = idempotencyService.checkAndStore(idempotencyKey, requestHash);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(existingRecord);
        verify(repository).findByKey(idempotencyKey);
        verify(repository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should throw exception when key exists but hash differs")
    void shouldThrowExceptionWhenKeyExistsButHashDiffers() {
        // Given
        String differentHash = "different-hash";
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.of(existingRecord));
        
        // When/Then
        assertThatThrownBy(() -> idempotencyService.checkAndStore(idempotencyKey, differentHash))
            .isInstanceOf(IdempotencyKeyConflictException.class)
            .hasMessageContaining("reused with a different request body");
        
        verify(repository).findByKey(idempotencyKey);
        verify(repository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should return empty when record is expired")
    void shouldReturnEmptyWhenRecordIsExpired() {
        // Given
        IdempotencyRecord expiredRecord = IdempotencyRecord.builder()
            .id(UUID.randomUUID())
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(201)
            .responseBody("{\"id\":\"123\"}")
            .createdAt(Instant.now().minusSeconds(25 * 3600)) // 25 hours ago
            .expiresAt(Instant.now().minusSeconds(3600)) // Expired 1 hour ago
            .build();
        
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.of(expiredRecord));
        
        // When
        Optional<IdempotencyRecord> result = idempotencyService.checkAndStore(idempotencyKey, requestHash);
        
        // Then
        assertThat(result).isEmpty();
        verify(repository).findByKey(idempotencyKey);
    }
    
    @Test
    @DisplayName("Should store response successfully")
    void shouldStoreResponseSuccessfully() {
        // Given
        Integer statusCode = 201;
        String responseBody = "{\"id\":\"123\"}";
        
        IdempotencyRecord savedRecord = IdempotencyRecord.builder()
            .id(UUID.randomUUID())
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(statusCode)
            .responseBody(responseBody)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(24 * 3600))
            .build();
        
        when(repository.save(any(IdempotencyRecord.class))).thenReturn(savedRecord);
        
        // When
        IdempotencyRecord result = idempotencyService.storeResponse(
            idempotencyKey,
            requestHash,
            statusCode,
            responseBody
        );
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIdempotencyKey()).isEqualTo(idempotencyKey);
        assertThat(result.getRequestHash()).isEqualTo(requestHash);
        assertThat(result.getStatusCode()).isEqualTo(statusCode);
        assertThat(result.getResponseBody()).isEqualTo(responseBody);
        verify(repository).save(any(IdempotencyRecord.class));
    }
    
    @Test
    @DisplayName("Should get cached response when exists and not expired")
    void shouldGetCachedResponseWhenExistsAndNotExpired() {
        // Given
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.of(existingRecord));
        
        // When
        Optional<IdempotencyRecord> result = idempotencyService.getCachedResponse(idempotencyKey);
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(existingRecord);
        verify(repository).findByKey(idempotencyKey);
    }
    
    @Test
    @DisplayName("Should return empty when cached response is expired")
    void shouldReturnEmptyWhenCachedResponseIsExpired() {
        // Given
        IdempotencyRecord expiredRecord = IdempotencyRecord.builder()
            .id(UUID.randomUUID())
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .statusCode(201)
            .responseBody("{\"id\":\"123\"}")
            .createdAt(Instant.now().minusSeconds(25 * 3600))
            .expiresAt(Instant.now().minusSeconds(3600)) // Expired
            .build();
        
        when(repository.findByKey(idempotencyKey)).thenReturn(Optional.of(expiredRecord));
        
        // When
        Optional<IdempotencyRecord> result = idempotencyService.getCachedResponse(idempotencyKey);
        
        // Then
        assertThat(result).isEmpty();
    }
    
    @Test
    @DisplayName("Should cleanup expired records")
    void shouldCleanupExpiredRecords() {
        // Given
        int deletedCount = 5;
        when(repository.deleteExpired(any(Instant.class))).thenReturn(deletedCount);
        
        // When
        int result = idempotencyService.cleanupExpiredRecords();
        
        // Then
        assertThat(result).isEqualTo(deletedCount);
        verify(repository).deleteExpired(any(Instant.class));
    }
    
    @Test
    @DisplayName("Should throw exception for null idempotency key")
    void shouldThrowExceptionForNullIdempotencyKey() {
        // When/Then
        assertThatThrownBy(() -> idempotencyService.checkAndStore(null, requestHash))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be null or blank");
    }
    
    @Test
    @DisplayName("Should throw exception for blank idempotency key")
    void shouldThrowExceptionForBlankIdempotencyKey() {
        // When/Then
        assertThatThrownBy(() -> idempotencyService.checkAndStore("  ", requestHash))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cannot be null or blank");
    }
}


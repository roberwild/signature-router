package com.singularbank.signature.routing.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link HealthStatus} value object.
 * Story 3.1: Provider Abstraction Interface
 */
class HealthStatusTest {
    
    @Test
    void up_shouldCreateHealthyStatus() {
        // Given
        String details = "Service operational (latency: 120ms)";
        
        // When
        HealthStatus status = HealthStatus.up(details);
        
        // Then
        assertThat(status.status()).isEqualTo(HealthStatus.Status.UP);
        assertThat(status.details()).isEqualTo(details);
        assertThat(status.details()).contains("operational");
        assertThat(status.timestamp()).isNotNull();
        assertThat(status.timestamp()).isBeforeOrEqualTo(Instant.now());
        assertThat(status.isHealthy()).isTrue();
    }
    
    @Test
    void down_shouldCreateUnhealthyStatus() {
        // Given
        String details = "Connection failed: timeout after 5s";
        
        // When
        HealthStatus status = HealthStatus.down(details);
        
        // Then
        assertThat(status.status()).isEqualTo(HealthStatus.Status.DOWN);
        assertThat(status.details()).isEqualTo(details);
        assertThat(status.details()).contains("failed");
        assertThat(status.timestamp()).isNotNull();
        assertThat(status.timestamp()).isBeforeOrEqualTo(Instant.now());
        assertThat(status.isHealthy()).isFalse();
    }
    
    @Test
    void timestamp_shouldBePopulatedAutomatically() {
        // Given
        Instant before = Instant.now();
        
        // When
        HealthStatus status = HealthStatus.up("Service operational");
        
        // Then
        Instant after = Instant.now();
        assertThat(status.timestamp()).isNotNull();
        assertThat(status.timestamp()).isBetween(before, after);
    }
    
    @Test
    void compactConstructor_shouldRequireNonNullStatus() {
        // When/Then
        assertThatThrownBy(() -> new HealthStatus(null, "details", Instant.now()))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("status");
    }
    
    @Test
    void compactConstructor_shouldRequireNonNullDetails() {
        // When/Then
        assertThatThrownBy(() -> new HealthStatus(HealthStatus.Status.UP, null, Instant.now()))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("details");
    }
    
    @Test
    void compactConstructor_shouldDefaultTimestampIfNull() {
        // Given
        Instant before = Instant.now();
        
        // When
        HealthStatus status = new HealthStatus(HealthStatus.Status.UP, "details", null);
        
        // Then
        Instant after = Instant.now();
        assertThat(status.timestamp()).isNotNull();
        assertThat(status.timestamp()).isBetween(before, after);
    }
    
    @Test
    void isHealthy_shouldReturnTrueForUpStatus() {
        // When
        HealthStatus status = HealthStatus.up("Service operational");
        
        // Then
        assertThat(status.isHealthy()).isTrue();
    }
    
    @Test
    void isHealthy_shouldReturnFalseForDownStatus() {
        // When
        HealthStatus status = HealthStatus.down("Service unavailable");
        
        // Then
        assertThat(status.isHealthy()).isFalse();
    }
    
    @Test
    void statusEnum_shouldHaveUpAndDownValues() {
        // When
        HealthStatus.Status[] values = HealthStatus.Status.values();
        
        // Then
        assertThat(values).hasSize(2);
        assertThat(values).contains(
            HealthStatus.Status.UP,
            HealthStatus.Status.DOWN
        );
    }
    
    @Test
    void equals_shouldWorkCorrectly() {
        // Given
        Instant now = Instant.now();
        HealthStatus status1 = new HealthStatus(HealthStatus.Status.UP, "operational", now);
        HealthStatus status2 = new HealthStatus(HealthStatus.Status.UP, "operational", now);
        HealthStatus status3 = new HealthStatus(HealthStatus.Status.DOWN, "operational", now);
        
        // Then
        assertThat(status1).isEqualTo(status2);
        assertThat(status1).isNotEqualTo(status3);
        assertThat(status1.hashCode()).isEqualTo(status2.hashCode());
    }
    
    @Test
    void toString_shouldContainAllFields() {
        // Given
        HealthStatus upStatus = HealthStatus.up("Service operational");
        HealthStatus downStatus = HealthStatus.down("Connection failed");
        
        // Then
        assertThat(upStatus.toString())
            .contains("UP")
            .contains("Service operational");
        
        assertThat(downStatus.toString())
            .contains("DOWN")
            .contains("Connection failed");
    }
}


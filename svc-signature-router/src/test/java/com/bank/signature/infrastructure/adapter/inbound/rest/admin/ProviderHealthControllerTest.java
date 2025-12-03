package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;
import com.bank.signature.application.dto.response.ProviderHealthDetail;
import com.bank.signature.application.service.ProviderHealthService;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderType;
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
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProviderHealthController.
 * Tests health check endpoint for provider monitoring.
 *
 * Coverage:
 * - GET /api/v1/admin/providers/health
 * - Cache vs refresh behavior
 * - Different health status scenarios (UP, DEGRADED, DOWN)
 * - Response format validation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProviderHealthController Tests")
class ProviderHealthControllerTest {

    @Mock
    private ProviderHealthService providerHealthService;

    @InjectMocks
    private ProviderHealthController controller;

    private AggregatedHealthResponse healthyResponse;
    private AggregatedHealthResponse degradedResponse;
    private AggregatedHealthResponse downResponse;

    @BeforeEach
    void setUp() {
        Instant now = Instant.now();

        // All providers UP
        List<ProviderHealthDetail> healthyProviders = Arrays.asList(
            new ProviderHealthDetail(
                "smsProvider",
                ProviderType.SMS,
                HealthStatus.UP,
                "Twilio SMS operational",
                now,
                120L,
                null
            ),
            new ProviderHealthDetail(
                "pushProvider",
                ProviderType.PUSH,
                HealthStatus.UP,
                "FCM Push operational",
                now,
                85L,
                null
            )
        );
        healthyResponse = new AggregatedHealthResponse(
            HealthStatus.UP,
            now,
            healthyProviders
        );

        // Some providers DOWN
        List<ProviderHealthDetail> degradedProviders = Arrays.asList(
            new ProviderHealthDetail(
                "smsProvider",
                ProviderType.SMS,
                HealthStatus.UP,
                "Twilio SMS operational",
                now,
                120L,
                null
            ),
            new ProviderHealthDetail(
                "pushProvider",
                ProviderType.PUSH,
                HealthStatus.DOWN,
                "FCM Push unavailable",
                now,
                5L,
                "Connection timeout"
            )
        );
        degradedResponse = new AggregatedHealthResponse(
            HealthStatus.DEGRADED,
            now,
            degradedProviders
        );

        // All providers DOWN
        List<ProviderHealthDetail> downProviders = Arrays.asList(
            new ProviderHealthDetail(
                "smsProvider",
                ProviderType.SMS,
                HealthStatus.DOWN,
                "Twilio SMS unavailable",
                now,
                5L,
                "Provider error"
            ),
            new ProviderHealthDetail(
                "pushProvider",
                ProviderType.PUSH,
                HealthStatus.DOWN,
                "FCM Push unavailable",
                now,
                5L,
                "Connection timeout"
            )
        );
        downResponse = new AggregatedHealthResponse(
            HealthStatus.DOWN,
            now,
            downProviders
        );
    }

    @Test
    @DisplayName("Should return health status with default refresh=false")
    void shouldReturnHealthStatus_DefaultRefresh() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().overallStatus()).isEqualTo(HealthStatus.UP);
        assertThat(response.getBody().providers()).hasSize(2);

        verify(providerHealthService).getProvidersHealth(false);
    }

    @Test
    @DisplayName("Should return health status with refresh=true")
    void shouldReturnHealthStatus_WithRefresh() {
        // Given
        when(providerHealthService.getProvidersHealth(true)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(true);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().overallStatus()).isEqualTo(HealthStatus.UP);

        verify(providerHealthService).getProvidersHealth(true);
    }

    @Test
    @DisplayName("Should return UP status when all providers healthy")
    void shouldReturnUp_WhenAllProvidersHealthy() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().overallStatus()).isEqualTo(HealthStatus.UP);
        assertThat(response.getBody().providers())
            .allMatch(p -> p.status() == HealthStatus.UP);
    }

    @Test
    @DisplayName("Should return DEGRADED status when some providers down")
    void shouldReturnDegraded_WhenSomeProvidersDown() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(degradedResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().overallStatus()).isEqualTo(HealthStatus.DEGRADED);
        assertThat(response.getBody().providers())
            .anyMatch(p -> p.status() == HealthStatus.UP);
        assertThat(response.getBody().providers())
            .anyMatch(p -> p.status() == HealthStatus.DOWN);
    }

    @Test
    @DisplayName("Should return DOWN status when all providers down")
    void shouldReturnDown_WhenAllProvidersDown() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(downResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().overallStatus()).isEqualTo(HealthStatus.DOWN);
        assertThat(response.getBody().providers())
            .allMatch(p -> p.status() == HealthStatus.DOWN);
    }

    @Test
    @DisplayName("Should include provider details in response")
    void shouldIncludeProviderDetails() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().providers()).hasSize(2);

        ProviderHealthDetail smsDetail = response.getBody().providers().get(0);
        assertThat(smsDetail.name()).isEqualTo("smsProvider");
        assertThat(smsDetail.type()).isEqualTo(ProviderType.SMS);
        assertThat(smsDetail.status()).isEqualTo(HealthStatus.UP);
        assertThat(smsDetail.latencyMs()).isEqualTo(120L);
        assertThat(smsDetail.errorMessage()).isNull();
    }

    @Test
    @DisplayName("Should include error message for down providers")
    void shouldIncludeErrorMessage_ForDownProviders() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(degradedResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        ProviderHealthDetail downProvider = response.getBody().providers().stream()
            .filter(p -> p.status() == HealthStatus.DOWN)
            .findFirst()
            .orElseThrow();

        assertThat(downProvider.errorMessage()).isNotNull();
        assertThat(downProvider.errorMessage()).isEqualTo("Connection timeout");
    }

    @Test
    @DisplayName("Should include timestamp in response")
    void shouldIncludeTimestamp() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().timestamp()).isNotNull();
        assertThat(response.getBody().timestamp()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    @DisplayName("Should call service with correct refresh parameter")
    void shouldCallServiceWithCorrectRefreshParameter() {
        // Given
        when(providerHealthService.getProvidersHealth(anyBoolean())).thenReturn(healthyResponse);

        // When - test both true and false
        controller.getProvidersHealth(true);
        controller.getProvidersHealth(false);

        // Then
        verify(providerHealthService).getProvidersHealth(true);
        verify(providerHealthService).getProvidersHealth(false);
    }

    @Test
    @DisplayName("Should always return HTTP 200 regardless of health status")
    void shouldAlwaysReturn200() {
        // Given - test all three health statuses
        when(providerHealthService.getProvidersHealth(false))
            .thenReturn(healthyResponse)
            .thenReturn(degradedResponse)
            .thenReturn(downResponse);

        // When/Then - all should return 200
        assertThat(controller.getProvidersHealth(false).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(controller.getProvidersHealth(false).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(controller.getProvidersHealth(false).getStatusCode())
            .isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Should include latency metrics for all providers")
    void shouldIncludeLatencyMetrics() {
        // Given
        when(providerHealthService.getProvidersHealth(false)).thenReturn(healthyResponse);

        // When
        ResponseEntity<AggregatedHealthResponse> response = controller.getProvidersHealth(false);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().providers())
            .allMatch(p -> p.latencyMs() != null && p.latencyMs() > 0);
    }
}

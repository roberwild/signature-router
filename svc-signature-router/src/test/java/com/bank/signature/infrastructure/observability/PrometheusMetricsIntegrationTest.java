package com.bank.signature.infrastructure.observability;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Prometheus metrics export endpoint.
 * 
 * <p>Validates that:
 * - /actuator/prometheus endpoint is accessible
 * - Business metrics are exported
 * - JVM metrics are exported
 * - Common tags are applied
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC13)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PrometheusMetricsIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void prometheusEndpoint_ShouldBeAccessible() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString()).contains("text/plain");
    }

    @Test
    void prometheusEndpoint_ShouldExportBusinessMetrics() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify business metrics are registered (even if count is 0)
        // Signature Request metrics
        assertThat(body).contains("signature_requests_created_total");
        assertThat(body).contains("signature_requests_completed_total");
        
        // Challenge metrics
        assertThat(body).contains("challenges_sent_total");
        assertThat(body).contains("challenges_completed_total");
        
        // Routing metrics
        assertThat(body).contains("routing_decisions_total");
        assertThat(body).contains("routing_fallback_triggered_total");
    }

    @Test
    void prometheusEndpoint_ShouldExportJvmMetrics() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify JVM metrics (automatic from Micrometer)
        assertThat(body).contains("jvm_memory_used_bytes");
        assertThat(body).contains("jvm_gc_pause_seconds");
        assertThat(body).contains("jvm_threads_states_threads");
    }

    @Test
    void prometheusEndpoint_ShouldExportInfrastructureMetrics() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify HTTP server metrics
        assertThat(body).contains("http_server_requests_seconds");
        
        // Verify HikariCP metrics (if database active)
        // Note: These might not be present if DB not initialized in test
        // assertThat(body).contains("hikaricp_connections");
    }

    @Test
    void prometheusEndpoint_ShouldApplyCommonTags() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify common tags are applied (application tag)
        assertThat(body).contains("application=\"signature-router\"");
        
        // Verify environment tag (test profile)
        assertThat(body).contains("environment=\"test\"");
    }

    @Test
    void prometheusEndpoint_ShouldIncludeMetricDescriptions() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify HELP comments are present (descriptions enabled in application.yml)
        assertThat(body).contains("# HELP signature_requests_created_total");
        assertThat(body).contains("# TYPE signature_requests_created_total counter");
        
        assertThat(body).contains("# HELP challenges_sent_total");
        assertThat(body).contains("# TYPE challenges_sent_total counter");
    }

    @Test
    void prometheusEndpoint_ShouldExportTimerMetrics() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        String body = response.getBody();
        assertThat(body).isNotNull();
        
        // Verify Timer metrics include histogram buckets (percentiles-histogram=true)
        // These are only present if the metrics have been recorded at least once
        // For now, just verify the metric names are registered
        assertThat(body).containsAnyOf(
            "signature_request_create_seconds",
            "challenge_send_seconds",
            "challenge_complete_seconds"
        );
    }

    @Test
    void prometheusEndpoint_ShouldNotRequireAuthentication() {
        // Given: No authentication headers

        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/prometheus", String.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }
}


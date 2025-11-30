package com.bank.signature.infrastructure.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metrics configuration for Prometheus export and custom metrics.
 * 
 * <p>Configures Micrometer MeterRegistry for:
 * - @Timed aspect support for use case metrics
 * - Common tags for multi-environment filtering (application, environment, region)
 * - Metric filters to exclude noisy actuator endpoints
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC12)
 * 
 * @author Signature Router Team
 * @since 1.0.0
 */
@Configuration
public class MetricsConfig {

    /**
     * Enables @Timed annotation support for automatic timing metrics.
     * 
     * <p>Allows use cases to be annotated with @Timed for automatic duration tracking:
     * <pre>
     * {@literal @}Timed(value = "signature.request.create", percentiles = {0.5, 0.95, 0.99})
     * public SignatureRequest execute(CreateSignatureRequestCommand cmd) {
     *     // Implementation
     * }
     * </pre>
     * 
     * @param registry the MeterRegistry to use for metric registration
     * @return TimedAspect bean
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    /**
     * Applies common tags to all metrics for multi-environment filtering.
     * 
     * <p>Tags applied:
     * - application: signature-router (fixed)
     * - environment: local/uat/prod (from active profile)
     * - region: local/us-east-1/eu-west-1 (from environment variable or default to environment)
     * 
     * <p>These tags enable filtering in Prometheus/Grafana queries:
     * <pre>
     * signature_requests_created_total{application="signature-router",environment="prod"}
     * </pre>
     * 
     * @param appName the application name from spring.application.name
     * @param environment the active profile (local/uat/prod)
     * @return MeterFilter for common tags
     */
    @Bean
    public MeterFilter commonTagsFilter(
            @Value("${spring.application.name:signature-router}") String appName,
            @Value("${spring.profiles.active:local}") String environment) {
        
        String region = System.getenv().getOrDefault("REGION", environment);
        
        return MeterFilter.commonTags(
            "application", appName,
            "environment", environment,
            "region", region
        );
    }

    /**
     * Excludes health check requests from HTTP server metrics.
     * 
     * <p>Health checks are very frequent (every 10s) and distort latency/throughput metrics.
     * This filter denies http_server_requests metrics where uri=/actuator/health.
     * 
     * <p>Rationale: Health checks should not count towards SLO metrics (availability, latency).
     * 
     * @return MeterFilter to deny health check metrics
     */
    @Bean
    public MeterFilter denyHealthCheckMetrics() {
        return MeterFilter.deny(id -> 
            id.getName().startsWith("http.server.requests") &&
            "/actuator/health".equals(id.getTag("uri"))
        );
    }

    /**
     * Excludes Prometheus scrape requests from HTTP server metrics.
     * 
     * <p>Prometheus scrapes /actuator/prometheus every 10s, which would create noise in metrics.
     * This filter denies http_server_requests metrics where uri=/actuator/prometheus.
     * 
     * <p>Rationale: Prometheus scrape should not count towards SLO metrics (would skew P99 latency).
     * 
     * @return MeterFilter to deny Prometheus endpoint metrics
     */
    @Bean
    public MeterFilter denyPrometheusMetrics() {
        return MeterFilter.deny(id -> 
            id.getName().startsWith("http.server.requests") &&
            "/actuator/prometheus".equals(id.getTag("uri"))
        );
    }
}


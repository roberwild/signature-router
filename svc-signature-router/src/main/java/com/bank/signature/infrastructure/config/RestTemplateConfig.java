package com.bank.signature.infrastructure.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplate configuration for HTTP client calls.
 * 
 * <p>Used by:</p>
 * <ul>
 *   <li>PrometheusQueryService - Query Prometheus metrics API</li>
 *   <li>Future HTTP integrations</li>
 * </ul>
 * 
 * @since Story 9.6 (SLO Compliance)
 */
@Configuration
public class RestTemplateConfig {
    
    /**
     * Creates a RestTemplate bean with sensible defaults.
     * 
     * @param builder RestTemplateBuilder auto-configured by Spring Boot
     * @return Configured RestTemplate instance
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
    }
}


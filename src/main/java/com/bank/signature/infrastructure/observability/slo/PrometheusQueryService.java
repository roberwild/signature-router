package com.bank.signature.infrastructure.observability.slo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Prometheus Query Service
 * 
 * Executes PromQL queries against Prometheus HTTP API and parses results.
 * Used for SLO calculations (error budget, availability metrics).
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrometheusQueryService {
    
    private final RestTemplate restTemplate;
    
    @Value("${observability.prometheus.url:http://localhost:9090}")
    private String prometheusUrl;
    
    /**
     * Execute a PromQL query and return the numeric result.
     * 
     * @param promql The PromQL query string
     * @return The numeric result (0.0 if no data or error)
     */
    public double query(String promql) {
        try {
            log.debug("Executing Prometheus query: {}", promql);
            
            String url = UriComponentsBuilder
                .fromHttpUrl(prometheusUrl)
                .path("/api/v1/query")
                .queryParam("query", promql)
                .build()
                .toUriString();
            
            PrometheusResponse response = restTemplate.getForObject(url, PrometheusResponse.class);
            
            if (response == null || !"success".equals(response.getStatus())) {
                log.warn("Prometheus query failed or returned non-success status");
                return 0.0;
            }
            
            PrometheusResponse.PrometheusData data = response.getData();
            if (data == null || data.getResult() == null || data.getResult().isEmpty()) {
                log.debug("Prometheus query returned no data");
                return 0.0;
            }
            
            // Extract value from first result: [timestamp, "value"]
            List<Object> valueArray = data.getResult().get(0).getValue();
            if (valueArray == null || valueArray.size() < 2) {
                log.warn("Prometheus result has unexpected format");
                return 0.0;
            }
            
            String valueStr = valueArray.get(1).toString();
            double result = Double.parseDouble(valueStr);
            
            log.debug("Prometheus query result: {}", result);
            return result;
            
        } catch (RestClientException e) {
            log.error("Failed to connect to Prometheus at {}: {}", prometheusUrl, e.getMessage());
            return 0.0;
        } catch (NumberFormatException e) {
            log.error("Failed to parse Prometheus result as number: {}", e.getMessage());
            return 0.0;
        } catch (Exception e) {
            log.error("Unexpected error executing Prometheus query", e);
            return 0.0;
        }
    }
    
    /**
     * Check if Prometheus is available.
     * 
     * @return true if Prometheus is reachable, false otherwise
     */
    public boolean isAvailable() {
        try {
            String url = prometheusUrl + "/-/healthy";
            restTemplate.getForObject(url, String.class);
            return true;
        } catch (Exception e) {
            log.warn("Prometheus is not available at {}", prometheusUrl);
            return false;
        }
    }
}


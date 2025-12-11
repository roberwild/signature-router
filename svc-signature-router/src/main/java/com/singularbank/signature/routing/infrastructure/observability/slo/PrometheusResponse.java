package com.singularbank.signature.routing.infrastructure.observability.slo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Prometheus API Response DTO
 * 
 * Maps the JSON response from Prometheus /api/v1/query endpoint.
 * 
 * Example response:
 * {
 *   "status": "success",
 *   "data": {
 *     "resultType": "vector",
 *     "result": [
 *       {
 *         "metric": {},
 *         "value": [1732881600, "1234.56"]
 *       }
 *     ]
 *   }
 * }
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrometheusResponse {
    
    private String status;
    private PrometheusData data;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PrometheusData {
        private String resultType;
        private List<PrometheusResult> result;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PrometheusResult {
        private PrometheusMetric metric;
        private List<Object> value; // [timestamp, "value"]
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PrometheusMetric {
        // Dynamic metric labels (empty for simple queries)
    }
}


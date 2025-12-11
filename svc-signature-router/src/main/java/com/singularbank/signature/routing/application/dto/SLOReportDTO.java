package com.singularbank.signature.routing.application.dto;

import com.singularbank.signature.routing.domain.model.valueobject.SLOStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.YearMonth;

/**
 * SLO Report DTO
 * 
 * Contains SLO compliance metrics for a given period (week/month).
 * Includes error budget calculation and recommendations.
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SLOReportDTO {
    
    /**
     * Reporting period (month)
     */
    private String period; // YYYY-MM for monthly, YYYY-Www for weekly
    
    /**
     * Total HTTP requests in the period
     */
    private Long totalRequests;
    
    /**
     * Failed requests (5xx errors) in the period
     */
    private Long failedRequests;
    
    /**
     * Actual availability (0.0 - 1.0)
     * Example: 0.9995 = 99.95%
     */
    private Double availability;
    
    /**
     * Error budget allowed (0.001 = 0.1% for 99.9% SLO)
     */
    private Double errorBudgetAllowed;
    
    /**
     * Error budget consumed (actual error rate)
     */
    private Double errorBudgetConsumed;
    
    /**
     * Error budget remaining (allowed - consumed)
     * Positive value = budget remaining
     * Negative value = SLO violated
     */
    private Double errorBudgetRemaining;
    
    /**
     * Error budget remaining as percentage of total budget
     * Example: 0.5 = 50% remaining
     */
    private Double errorBudgetRemainingPercent;
    
    /**
     * SLO compliance status
     */
    private SLOStatus sloStatus;
    
    /**
     * Timestamp when report was generated
     */
    private Instant generatedAt;
    
    /**
     * Average P99 latency in the period (seconds)
     */
    private Double p99Latency;
    
    /**
     * Performance SLO status (true if P99 < 300ms)
     */
    private Boolean performanceSloMet;
    
    /**
     * Recommendations based on SLO status
     */
    private String recommendations;
}


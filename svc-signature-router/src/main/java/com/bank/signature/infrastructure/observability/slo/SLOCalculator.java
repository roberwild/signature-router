package com.bank.signature.infrastructure.observability.slo;

import com.bank.signature.application.dto.SLOReportDTO;
import com.bank.signature.domain.model.valueobject.SLOStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

/**
 * SLO Calculator Service
 * 
 * Calculates SLO compliance metrics including:
 * - Availability (% of successful requests)
 * - Error budget (allowed failures vs actual failures)
 * - Performance SLO (P99 latency)
 * 
 * SLO Targets:
 * - Availability: ≥99.9% (0.1% error budget = 43 min/month downtime)
 * - Performance: P99 < 300ms
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SLOCalculator {
    
    private final PrometheusQueryService prometheusQueryService;
    
    // SLO targets
    private static final double AVAILABILITY_SLO = 0.999; // 99.9%
    private static final double ERROR_BUDGET_ALLOWED = 1.0 - AVAILABILITY_SLO; // 0.1%
    private static final double PERFORMANCE_SLO_P99_SECONDS = 0.3; // 300ms
    
    // Error budget thresholds for status determination
    private static final double ERROR_BUDGET_AT_RISK_THRESHOLD = 0.5; // 50% remaining
    private static final double ERROR_BUDGET_CRITICAL_THRESHOLD = 0.2; // 20% remaining
    
    /**
     * Calculate monthly SLO report.
     * 
     * @param month The month to calculate (YYYY-MM)
     * @return SLO report with error budget metrics
     */
    public SLOReportDTO calculateMonthly(YearMonth month) {
        log.info("Calculating monthly SLO report for {}", month);
        
        String period = month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String timeRange = "30d"; // Last 30 days
        
        return calculateSLOReport(period, timeRange);
    }
    
    /**
     * Calculate weekly SLO report.
     * 
     * @param weekStart The start of the week (Monday)
     * @return SLO report with error budget metrics
     */
    public SLOReportDTO calculateWeekly(LocalDate weekStart) {
        LocalDate monday = weekStart.with(DayOfWeek.MONDAY);
        log.info("Calculating weekly SLO report for week starting {}", monday);
        
        String period = monday.format(DateTimeFormatter.ofPattern("yyyy-'W'ww"));
        String timeRange = "7d"; // Last 7 days
        
        return calculateSLOReport(period, timeRange);
    }
    
    /**
     * Calculate SLO report for a given time range.
     */
    private SLOReportDTO calculateSLOReport(String period, String timeRange) {
        // Query Prometheus for total requests
        double totalRequests = prometheusQueryService.query(
            String.format("sum(increase(http_server_requests_seconds_count[%s]))", timeRange)
        );
        
        // Query Prometheus for failed requests (5xx errors)
        double failedRequests = prometheusQueryService.query(
            String.format("sum(increase(http_server_requests_seconds_count{status=~\"5..\"}[%s]))", timeRange)
        );
        
        // Query Prometheus for P99 latency
        double p99Latency = prometheusQueryService.query(
            String.format("histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[%s])) by (le))", timeRange)
        );
        
        // Calculate availability
        double availability = totalRequests > 0
            ? 1.0 - (failedRequests / totalRequests)
            : 1.0; // 100% if no requests (avoid division by zero)
        
        // Calculate error budget
        double errorBudgetConsumed = totalRequests > 0
            ? failedRequests / totalRequests
            : 0.0;
        
        double errorBudgetRemaining = ERROR_BUDGET_ALLOWED - errorBudgetConsumed;
        
        double errorBudgetRemainingPercent = ERROR_BUDGET_ALLOWED > 0
            ? errorBudgetRemaining / ERROR_BUDGET_ALLOWED
            : 1.0;
        
        // Determine SLO status
        SLOStatus sloStatus = determineSLOStatus(errorBudgetRemainingPercent);
        
        // Check performance SLO
        boolean performanceSloMet = p99Latency < PERFORMANCE_SLO_P99_SECONDS;
        
        // Generate recommendations
        String recommendations = generateRecommendations(sloStatus, performanceSloMet);
        
        SLOReportDTO report = SLOReportDTO.builder()
            .period(period)
            .totalRequests((long) totalRequests)
            .failedRequests((long) failedRequests)
            .availability(availability)
            .errorBudgetAllowed(ERROR_BUDGET_ALLOWED)
            .errorBudgetConsumed(errorBudgetConsumed)
            .errorBudgetRemaining(errorBudgetRemaining)
            .errorBudgetRemainingPercent(errorBudgetRemainingPercent)
            .sloStatus(sloStatus)
            .p99Latency(p99Latency)
            .performanceSloMet(performanceSloMet)
            .recommendations(recommendations)
            .generatedAt(Instant.now())
            .build();
        
        log.info("SLO Report: period={}, availability={}, status={}, errorBudgetRemaining={}%",
            period,
            String.format("%.4f%%", availability * 100),
            sloStatus,
            String.format("%.2f", errorBudgetRemainingPercent * 100)
        );
        
        return report;
    }
    
    /**
     * Determine SLO status based on error budget remaining percentage.
     * 
     * - COMPLIANT: >50% budget remaining (safe to deploy)
     * - AT_RISK: 20-50% budget remaining (reduce deployments)
     * - VIOLATED: <20% budget remaining (freeze deployments)
     */
    private SLOStatus determineSLOStatus(double errorBudgetRemainingPercent) {
        if (errorBudgetRemainingPercent > ERROR_BUDGET_AT_RISK_THRESHOLD) {
            return SLOStatus.COMPLIANT;
        } else if (errorBudgetRemainingPercent > ERROR_BUDGET_CRITICAL_THRESHOLD) {
            return SLOStatus.AT_RISK;
        } else {
            return SLOStatus.VIOLATED;
        }
    }
    
    /**
     * Generate actionable recommendations based on SLO status.
     */
    private String generateRecommendations(SLOStatus sloStatus, boolean performanceSloMet) {
        StringBuilder recommendations = new StringBuilder();
        
        switch (sloStatus) {
            case VIOLATED:
                recommendations.append("⚠️ **CRITICAL:** SLO violated - Error budget exhausted\n");
                recommendations.append("- Freeze all non-critical deployments immediately\n");
                recommendations.append("- Focus on stability improvements only\n");
                recommendations.append("- Review and fix recent incidents (postmortems)\n");
                recommendations.append("- Add preventive monitoring for recurring issues\n");
                break;
                
            case AT_RISK:
                recommendations.append("⚠️ **WARNING:** Error budget below 50%\n");
                recommendations.append("- Reduce deployment frequency\n");
                recommendations.append("- Increase testing rigor before releases\n");
                recommendations.append("- Monitor error rates closely\n");
                recommendations.append("- Consider delaying non-critical features\n");
                break;
                
            case COMPLIANT:
                recommendations.append("✅ **HEALTHY:** SLO compliance maintained\n");
                recommendations.append("- Continue current practices\n");
                recommendations.append("- Safe to deploy new features\n");
                recommendations.append("- Maintain monitoring vigilance\n");
                break;
        }
        
        if (!performanceSloMet) {
            recommendations.append("\n⚠️ **Performance SLO violated:** P99 latency exceeds 300ms\n");
            recommendations.append("- Investigate slow endpoints\n");
            recommendations.append("- Review database query performance\n");
            recommendations.append("- Check provider integration latencies\n");
        }
        
        return recommendations.toString();
    }
}


package com.bank.signature.infrastructure.observability.slo;

import com.bank.signature.application.dto.SLOReportDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * SLO Report Scheduler
 * 
 * Generates automated SLO compliance reports on a schedule:
 * - Weekly: Every Monday at 9:00 AM
 * - Monthly: First day of month at 9:00 AM
 * 
 * Reports are logged and can be extended to send emails.
 * 
 * Enable/disable via: observability.slo.scheduler.enabled=true/false
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(
    value = "observability.slo.scheduler.enabled",
    havingValue = "true",
    matchIfMissing = false
)
public class SLOReportScheduler {
    
    private final SLOCalculator sloCalculator;
    private final SLOReportService sloReportService;
    
    /**
     * Generate weekly SLO report every Monday at 9:00 AM.
     * Reports on the previous week (Monday to Sunday).
     */
    @Scheduled(cron = "${observability.slo.scheduler.weekly.cron:0 0 9 * * MON}")
    public void generateWeeklySLOReport() {
        log.info("=".repeat(80));
        log.info("🔔 Generating Weekly SLO Report");
        log.info("=".repeat(80));
        
        try {
            LocalDate weekStart = LocalDate.now().minusWeeks(1).with(DayOfWeek.MONDAY);
            SLOReportDTO report = sloCalculator.calculateWeekly(weekStart);
            
            String markdown = sloReportService.generateMarkdown(report);
            String summary = sloReportService.generatePlainTextSummary(report);
            
            log.info("Weekly SLO Report Generated:");
            log.info(summary);
            log.info("\n{}", markdown);
            
            // TODO: Send email to stakeholders (Story 9.6 - future enhancement)
            // emailService.sendSLOReport(report, markdown, WEEKLY_RECIPIENTS);
            
            log.info("✅ Weekly SLO report generation completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Failed to generate weekly SLO report", e);
        }
        
        log.info("=".repeat(80));
    }
    
    /**
     * Generate monthly SLO report on the 1st of each month at 9:00 AM.
     * Reports on the previous month.
     */
    @Scheduled(cron = "${observability.slo.scheduler.monthly.cron:0 0 9 1 * *}")
    public void generateMonthlySLOReport() {
        log.info("=".repeat(80));
        log.info("🔔 Generating Monthly SLO Report");
        log.info("=".repeat(80));
        
        try {
            YearMonth previousMonth = YearMonth.now().minusMonths(1);
            SLOReportDTO report = sloCalculator.calculateMonthly(previousMonth);
            
            String markdown = sloReportService.generateMarkdown(report);
            String summary = sloReportService.generatePlainTextSummary(report);
            
            log.info("Monthly SLO Report Generated:");
            log.info(summary);
            log.info("\n{}", markdown);
            
            // TODO: Send email to stakeholders (Story 9.6 - future enhancement)
            // emailService.sendSLOReport(report, markdown, MONTHLY_RECIPIENTS);
            
            log.info("✅ Monthly SLO report generation completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Failed to generate monthly SLO report", e);
        }
        
        log.info("=".repeat(80));
    }
}


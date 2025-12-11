package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest;

import com.singularbank.signature.routing.application.dto.SLOReportDTO;
import com.singularbank.signature.routing.infrastructure.observability.slo.SLOCalculator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * SLO Status Controller
 * 
 * REST API for querying current SLO compliance status.
 * 
 * Endpoints:
 * - GET /api/v1/slo/status - Monthly SLO status
 * - GET /api/v1/slo/status/weekly - Weekly SLO status
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/slo")
@RequiredArgsConstructor
@Tag(name = "SLO Monitoring", description = "SLO compliance and error budget APIs")
public class SLOController {
    
    private final SLOCalculator sloCalculator;
    
    /**
     * Get current monthly SLO status.
     * 
     * Returns SLO compliance metrics for the current month including:
     * - Availability (%)
     * - Error budget remaining
     * - Performance SLO status (P99 latency)
     * - Recommendations
     * 
     * @return Monthly SLO report
     */
    @GetMapping("/status")
    @Operation(
        summary = "Get current monthly SLO status",
        description = "Returns SLO compliance metrics for the current month (last 30 days)"
    )
    public ResponseEntity<SLOReportDTO> getMonthlySLOStatus() {
        log.info("GET /api/v1/slo/status - Fetching monthly SLO status");
        
        YearMonth currentMonth = YearMonth.now();
        SLOReportDTO report = sloCalculator.calculateMonthly(currentMonth);
        
        log.info("Monthly SLO status: {}", report.getSloStatus());
        
        return ResponseEntity.ok(report);
    }
    
    /**
     * Get current weekly SLO status.
     * 
     * Returns SLO compliance metrics for the current week (last 7 days).
     * 
     * @return Weekly SLO report
     */
    @GetMapping("/status/weekly")
    @Operation(
        summary = "Get current weekly SLO status",
        description = "Returns SLO compliance metrics for the current week (last 7 days)"
    )
    public ResponseEntity<SLOReportDTO> getWeeklySLOStatus() {
        log.info("GET /api/v1/slo/status/weekly - Fetching weekly SLO status");
        
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        SLOReportDTO report = sloCalculator.calculateWeekly(weekStart);
        
        log.info("Weekly SLO status: {}", report.getSloStatus());
        
        return ResponseEntity.ok(report);
    }
}


package com.bank.signature.application.service;

import com.bank.signature.application.dto.request.AlertFilters;
import com.bank.signature.application.dto.response.AlertResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Mock Implementation of AlertManager Service
 * Story 12.7: Prometheus AlertManager Integration
 * 
 * This is a mock implementation for development/testing without real Prometheus AlertManager.
 * In production, replace with AlertManagerServiceImpl that connects to real AlertManager API.
 * 
 * Activated when: admin.portal.alerts.mock=true
 */
@Service
@ConditionalOnProperty(name = "admin.portal.alerts.mock", havingValue = "true", matchIfMissing = true)
@Slf4j
public class AlertManagerServiceMockImpl implements AlertManagerService {
    
    private final ConcurrentHashMap<String, AlertResponse> mockAlerts = new ConcurrentHashMap<>();
    
    public AlertManagerServiceMockImpl() {
        log.warn("🎭 Using MOCK AlertManager Service (Development/Testing only)");
        log.warn("Set alertmanager.mock=false to use real Prometheus AlertManager integration");
        initializeMockAlerts();
    }
    
    /**
     * Initialize with some mock alerts
     */
    private void initializeMockAlerts() {
        mockAlerts.put("alert-001", AlertResponse.builder()
            .id("alert-001")
            .name("HighErrorRate")
            .description("Error rate above 5% for 5 minutes")
            .severity("CRITICAL")
            .status("ACTIVE")
            .startsAt(Instant.now().minusSeconds(15 * 60))
            .endsAt(null)
            .labels(Map.of(
                "service", "signature-router",
                "env", "prod",
                "alertname", "HighErrorRate"
            ))
            .annotations(Map.of(
                "summary", "High error rate detected",
                "description", "Error rate is 8.5% (threshold: 5%)",
                "runbook", "https://runbook.example.com/high-error-rate"
            ))
            .build());
        
        mockAlerts.put("alert-002", AlertResponse.builder()
            .id("alert-002")
            .name("ProviderDown")
            .description("Provider AutoFirma is not responding")
            .severity("CRITICAL")
            .status("ACKNOWLEDGED")
            .startsAt(Instant.now().minusSeconds(30 * 60))
            .endsAt(null)
            .labels(Map.of(
                "service", "signature-router",
                "provider", "AutoFirma",
                "env", "prod",
                "alertname", "ProviderDown"
            ))
            .annotations(Map.of(
                "summary", "Provider AutoFirma is down",
                "description", "Circuit breaker is OPEN for AutoFirma",
                "runbook", "https://runbook.example.com/provider-down"
            ))
            .build());
        
        mockAlerts.put("alert-003", AlertResponse.builder()
            .id("alert-003")
            .name("HighLatency")
            .description("P95 latency above 2 seconds")
            .severity("WARNING")
            .status("ACTIVE")
            .startsAt(Instant.now().minusSeconds(5 * 60))
            .endsAt(null)
            .labels(Map.of(
                "service", "signature-router",
                "env", "prod",
                "alertname", "HighLatency"
            ))
            .annotations(Map.of(
                "summary", "High latency detected",
                "description", "P95 latency is 2.3s (threshold: 2s)",
                "runbook", "https://runbook.example.com/high-latency"
            ))
            .build());
        
        mockAlerts.put("alert-004", AlertResponse.builder()
            .id("alert-004")
            .name("DiskSpaceWarning")
            .description("Disk usage above 80%")
            .severity("WARNING")
            .status("ACTIVE")
            .startsAt(Instant.now().minusSeconds(60 * 60))
            .endsAt(null)
            .labels(Map.of(
                "service", "signature-router",
                "env", "prod",
                "alertname", "DiskSpaceWarning"
            ))
            .annotations(Map.of(
                "summary", "Disk space is running low",
                "description", "Disk usage is 85% (threshold: 80%)",
                "runbook", "https://runbook.example.com/disk-space"
            ))
            .build());
        
        mockAlerts.put("alert-005", AlertResponse.builder()
            .id("alert-005")
            .name("SLODegraded")
            .description("SLO below target (99.9%)")
            .severity("INFO")
            .status("RESOLVED")
            .startsAt(Instant.now().minusSeconds(120 * 60))
            .endsAt(Instant.now().minusSeconds(90 * 60))
            .labels(Map.of(
                "service", "signature-router",
                "env", "prod",
                "alertname", "SLODegraded"
            ))
            .annotations(Map.of(
                "summary", "SLO degraded below target",
                "description", "SLO is 99.85% (target: 99.9%)",
                "runbook", "https://runbook.example.com/slo-degraded"
            ))
            .build());
        
        log.info("Initialized {} mock alerts", mockAlerts.size());
    }
    
    @Override
    public List<AlertResponse> getAlerts(AlertFilters filters) {
        log.info("[MOCK] Getting alerts with filters: severity={}, status={}",
            filters != null ? filters.severity() : "null",
            filters != null ? filters.status() : "null");
        
        List<AlertResponse> alerts = new ArrayList<>(mockAlerts.values());
        
        // Apply filters
        if (filters != null) {
            if (filters.severity() != null) {
                alerts = alerts.stream()
                    .filter(a -> a.severity().equalsIgnoreCase(filters.severity()))
                    .collect(Collectors.toList());
            }
            
            if (filters.status() != null) {
                alerts = alerts.stream()
                    .filter(a -> a.status().equalsIgnoreCase(filters.status()))
                    .collect(Collectors.toList());
            }
        }
        
        // Sort by severity (CRITICAL > WARNING > INFO) and then by startsAt (newest first)
        alerts.sort((a1, a2) -> {
            int severityCompare = getSeverityOrder(a2.severity()) - getSeverityOrder(a1.severity());
            if (severityCompare != 0) {
                return severityCompare;
            }
            return a2.startsAt().compareTo(a1.startsAt());
        });
        
        log.info("[MOCK] Returning {} alerts", alerts.size());
        
        return alerts;
    }
    
    private int getSeverityOrder(String severity) {
        return switch (severity.toUpperCase()) {
            case "CRITICAL" -> 3;
            case "WARNING" -> 2;
            case "INFO" -> 1;
            default -> 0;
        };
    }
    
    @Override
    public AlertResponse getAlertById(String alertId) {
        log.info("[MOCK] Getting alert by ID: {}", alertId);
        
        AlertResponse alert = mockAlerts.get(alertId);
        if (alert == null) {
            throw new IllegalArgumentException("Alert not found: " + alertId);
        }
        
        return alert;
    }
    
    @Override
    public void acknowledgeAlert(String alertId) {
        log.info("[MOCK] Acknowledging alert: {}", alertId);
        
        AlertResponse existing = mockAlerts.get(alertId);
        if (existing == null) {
            throw new IllegalArgumentException("Alert not found: " + alertId);
        }
        
        if (!"ACTIVE".equals(existing.status())) {
            log.warn("[MOCK] Alert {} is not ACTIVE (status: {}), cannot acknowledge", alertId, existing.status());
            throw new IllegalStateException("Alert is not ACTIVE");
        }
        
        AlertResponse updated = AlertResponse.builder()
            .id(existing.id())
            .name(existing.name())
            .description(existing.description())
            .severity(existing.severity())
            .status("ACKNOWLEDGED")
            .startsAt(existing.startsAt())
            .endsAt(existing.endsAt())
            .labels(existing.labels())
            .annotations(existing.annotations())
            .build();
        
        mockAlerts.put(alertId, updated);
        
        log.info("[MOCK] Alert {} acknowledged", alertId);
    }
    
    @Override
    public void resolveAlert(String alertId) {
        log.info("[MOCK] Resolving alert: {}", alertId);
        
        AlertResponse existing = mockAlerts.get(alertId);
        if (existing == null) {
            throw new IllegalArgumentException("Alert not found: " + alertId);
        }
        
        if ("RESOLVED".equals(existing.status())) {
            log.warn("[MOCK] Alert {} is already RESOLVED", alertId);
            return;
        }
        
        AlertResponse updated = AlertResponse.builder()
            .id(existing.id())
            .name(existing.name())
            .description(existing.description())
            .severity(existing.severity())
            .status("RESOLVED")
            .startsAt(existing.startsAt())
            .endsAt(Instant.now())
            .labels(existing.labels())
            .annotations(existing.annotations())
            .build();
        
        mockAlerts.put(alertId, updated);
        
        log.info("[MOCK] Alert {} resolved", alertId);
    }
}


package com.bank.signature.application.service;

import com.bank.signature.application.dto.request.AlertFilters;
import com.bank.signature.application.dto.response.AlertResponse;

import java.util.List;

/**
 * AlertManager Service
 * Story 12.7: Prometheus AlertManager Integration
 * 
 * Service for managing system alerts from Prometheus AlertManager
 */
public interface AlertManagerService {
    
    /**
     * Get all alerts with optional filters
     * 
     * @param filters Optional filters (severity, status)
     * @return List of alerts
     */
    List<AlertResponse> getAlerts(AlertFilters filters);
    
    /**
     * Get single alert by ID
     * 
     * @param alertId Alert ID
     * @return Alert details
     */
    AlertResponse getAlertById(String alertId);
    
    /**
     * Acknowledge an alert
     * Creates a silence in AlertManager
     * 
     * @param alertId Alert ID
     */
    void acknowledgeAlert(String alertId);
    
    /**
     * Resolve an alert manually
     * 
     * @param alertId Alert ID
     */
    void resolveAlert(String alertId);
}


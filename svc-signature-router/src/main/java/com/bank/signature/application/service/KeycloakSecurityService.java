package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.AccessEventResponse;
import com.bank.signature.application.dto.response.SecurityOverviewResponse;

import java.util.List;

/**
 * Keycloak Security Service
 * Story 12.6: Keycloak Security Audit Endpoint
 * 
 * Service for security metrics and audit events from Keycloak
 */
public interface KeycloakSecurityService {
    
    /**
     * Get security overview metrics
     * 
     * @return Security overview
     */
    SecurityOverviewResponse getSecurityOverview();
    
    /**
     * Get access audit events (login/logout)
     * 
     * @param limit Maximum number of events to return
     * @return List of access events
     */
    List<AccessEventResponse> getAccessAudit(int limit);
}


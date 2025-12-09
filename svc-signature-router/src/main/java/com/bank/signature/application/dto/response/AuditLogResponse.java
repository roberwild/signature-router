package com.bank.signature.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Audit Log Response DTO
 * Epic 17: Comprehensive Audit Trail
 * Story 17.3: Audit Log REST API Endpoints
 * 
 * @since Epic 17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    
    private UUID id;
    
    private Instant timestamp;
    
    private UUID userId;
    
    private String username;
    
    private String operation;
    
    private String entityType;
    
    private String entityId;
    
    private String entityName;
    
    private Map<String, Object> changes;
    
    private String ipAddress;
    
    private String userAgent;
    
    private boolean success;
    
    private String errorMessage;
    
    private Map<String, Object> metadata;
}


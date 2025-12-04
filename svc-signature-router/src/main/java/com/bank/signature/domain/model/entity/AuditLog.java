package com.bank.signature.domain.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Audit Log Domain Entity
 * Epic 8: Basic audit logging
 *
 * @since Epic 8
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    private UUID id;
    private Instant timestamp;
    private UUID userId;
    private String username;
    private OperationType operation;
    private EntityType entityType;
    private String entityId;
    private String entityName;
    private Map<String, Object> changes;
    private String ipAddress;
    private String userAgent;
    private boolean success;
    private String errorMessage;
    private Map<String, Object> metadata;

    public enum OperationType {
        CREATE,
        UPDATE,
        DELETE,
        LOGIN,
        LOGOUT,
        READ,
        EXECUTE
    }

    public enum EntityType {
        PROVIDER,
        ROUTING_RULE,
        SIGNATURE_REQUEST,
        USER_PROFILE,
        ALERT,
        CONFIGURATION,
        SECURITY_SETTING
    }
}


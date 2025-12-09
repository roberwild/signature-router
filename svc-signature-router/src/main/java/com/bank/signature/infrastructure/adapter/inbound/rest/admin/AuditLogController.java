package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import com.bank.signature.application.dto.response.AuditLogResponse;
import com.bank.signature.application.service.AuditLogService;
import com.bank.signature.domain.model.entity.AuditLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Audit Log REST Controller
 * Epic 17: Comprehensive Audit Trail
 * Story 17.3: Audit Log REST API Endpoints
 * 
 * <p>Provides endpoints for querying and analyzing audit logs.
 * 
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/v1/admin/audit - List all audit logs with pagination</li>
 *   <li>GET /api/v1/admin/audit/search - Search with filters</li>
 *   <li>GET /api/v1/admin/audit/entity/{entityId} - Get history for entity</li>
 *   <li>GET /api/v1/admin/audit/stats - Get audit statistics</li>
 *   <li>GET /api/v1/admin/audit/filters - Get available filter options</li>
 * </ul>
 * 
 * <p>Security: ADMIN role required for all endpoints.
 * 
 * @since Epic 17
 */
@RestController
@RequestMapping("/api/v1/admin/audit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Audit Log", description = "Comprehensive audit trail for compliance and security")
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    
    /**
     * List all audit logs with pagination and sorting.
     */
    @GetMapping
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "List all audit logs", description = """
            Returns paginated list of all audit log entries.
            
            Default sort: timestamp DESC (most recent first).
            """)
    public ResponseEntity<Page<AuditLogResponse>> listAuditLogs(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "timestamp") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)") @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        log.info("GET /api/v1/admin/audit - page={}, size={}, sortBy={}, sortDir={}",
            page, size, sortBy, sortDir);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AuditLog> auditLogs = auditLogService.findAll(pageable);
        Page<AuditLogResponse> response = auditLogs.map(this::toResponse);
        
        log.info("Retrieved {} audit logs (total: {}, pages: {})",
            response.getNumberOfElements(), response.getTotalElements(), response.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Search audit logs with multiple filters.
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Search audit logs", description = """
            Search audit logs with multiple optional filters.
            
            All filters are combined with AND logic.
            """)
    public ResponseEntity<Page<AuditLogResponse>> searchAuditLogs(
            @Parameter(description = "Filter by username") @RequestParam(required = false) String username,
            @Parameter(description = "Filter by operation") @RequestParam(required = false) AuditLog.OperationType operation,
            @Parameter(description = "Filter by entity type") @RequestParam(required = false) AuditLog.EntityType entityType,
            @Parameter(description = "Start date (ISO-8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @Parameter(description = "End date (ISO-8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size
    ) {
        log.info("GET /api/v1/admin/audit/search - username={}, operation={}, entityType={}, startDate={}, endDate={}",
            username, operation, entityType, startDate, endDate);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Page<AuditLog> auditLogs = auditLogService.search(
            username, operation, entityType, startDate, endDate, pageable
        );
        Page<AuditLogResponse> response = auditLogs.map(this::toResponse);
        
        log.info("Search returned {} audit logs (total: {})", response.getNumberOfElements(), response.getTotalElements());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get audit history for a specific entity.
     */
    @GetMapping("/entity/{entityId}")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Get entity audit history", description = """
            Returns complete audit history for a specific entity.
            
            Useful for viewing who changed what and when for a particular resource.
            """)
    public ResponseEntity<List<AuditLogResponse>> getEntityHistory(@PathVariable String entityId) {
        log.info("GET /api/v1/admin/audit/entity/{}", entityId);
        
        List<AuditLog> auditLogs = auditLogService.findByEntityId(entityId);
        List<AuditLogResponse> response = auditLogs.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        
        log.info("Retrieved {} audit logs for entity {}", response.size(), entityId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get audit log statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Get audit statistics", description = """
            Returns aggregated statistics about audit logs:
            - Total logs count
            - Count by operation type (CREATE, UPDATE, DELETE, etc.)
            - Count by entity type (PROVIDER, ROUTING_RULE, etc.)
            """)
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.info("GET /api/v1/admin/audit/stats");
        
        Map<String, Object> stats = auditLogService.getStatistics();
        
        log.info("Audit stats: totalLogs={}, creates={}, updates={}, deletes={}",
            stats.get("totalLogs"),
            stats.get("createOperations"),
            stats.get("updateOperations"),
            stats.get("deleteOperations"));
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get available filter options.
     */
    @GetMapping("/filters")
    @PreAuthorize("hasRole('PRF_ADMIN')")
    @Operation(summary = "Get filter options", description = """
            Returns lists of valid values for operation and entity type filters.
            
            Useful for building dropdown filters in the UI.
            """)
    public ResponseEntity<Map<String, List<String>>> getFilterOptions() {
        log.info("GET /api/v1/admin/audit/filters");
        
        Map<String, List<String>> filters = new HashMap<>();
        
        filters.put("operations", Arrays.stream(AuditLog.OperationType.values())
            .map(Enum::name)
            .collect(Collectors.toList()));
        
        filters.put("entityTypes", Arrays.stream(AuditLog.EntityType.values())
            .map(Enum::name)
            .collect(Collectors.toList()));
        
        return ResponseEntity.ok(filters);
    }
    
    // ========================================
    // Helper: Domain to DTO
    // ========================================
    
    private AuditLogResponse toResponse(AuditLog domain) {
        return AuditLogResponse.builder()
            .id(domain.getId())
            .timestamp(domain.getTimestamp())
            .userId(domain.getUserId())
            .username(domain.getUsername())
            .operation(domain.getOperation() != null ? domain.getOperation().name() : null)
            .entityType(domain.getEntityType() != null ? domain.getEntityType().name() : null)
            .entityId(domain.getEntityId())
            .entityName(domain.getEntityName())
            .changes(domain.getChanges())
            .ipAddress(domain.getIpAddress())
            .userAgent(domain.getUserAgent())
            .success(domain.isSuccess())
            .errorMessage(domain.getErrorMessage())
            .metadata(domain.getMetadata())
            .build();
    }
}


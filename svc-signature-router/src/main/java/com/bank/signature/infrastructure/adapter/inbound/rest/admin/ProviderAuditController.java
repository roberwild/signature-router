package com.bank.signature.infrastructure.adapter.inbound.rest.admin;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bank.signature.application.dto.response.ProviderHistoryResponse;
import com.bank.signature.domain.model.ProviderConfigHistory;
import com.bank.signature.domain.port.outbound.ProviderConfigHistoryRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Provider Audit REST Controller
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 * 
 * Endpoints:
 * - GET /api/v1/admin/providers/{id}/history - Get provider history
 * - GET /api/v1/admin/providers/history - Get recent history
 */
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Provider Audit", description = "Provider configuration audit trail and history")
public class ProviderAuditController {

    private final ProviderConfigHistoryRepository historyRepository;

    @GetMapping("/{id}/history")
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "Get provider history", description = "Retrieve audit history for a specific provider")
    public ResponseEntity<List<ProviderHistoryResponse>> getProviderHistory(@PathVariable UUID id) {
        log.info("GET /api/v1/admin/providers/{}/history", id);

        List<ProviderConfigHistory> history = historyRepository.findByProviderConfigId(id);

        List<ProviderHistoryResponse> responses = history.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('PRF_ADMIN') or hasRole('PRF_CONSULTIVO')")
    @Operation(summary = "Get recent history", description = "Retrieve recent audit history across all providers")
    public ResponseEntity<List<ProviderHistoryResponse>> getRecentHistory(
            @RequestParam(defaultValue = "50") int limit) {
        log.info("GET /api/v1/admin/providers/history - limit={}", limit);

        List<ProviderConfigHistory> history = historyRepository.findRecentHistory(Math.min(limit, 100));

        List<ProviderHistoryResponse> responses = history.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    private ProviderHistoryResponse toResponse(ProviderConfigHistory history) {
        return ProviderHistoryResponse.builder()
                .id(history.getId())
                .providerConfigId(history.getProviderConfigId())
                .changedAt(history.getChangedAt())
                .changedBy(history.getChangedBy())
                .changeType(history.getChangeType())
                .oldConfigJson(history.getOldConfigJson())
                .newConfigJson(history.getNewConfigJson())
                .remarks(history.getRemarks())
                .build();
    }
}

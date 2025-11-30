package com.bank.signature.application.eventlistener;

import com.bank.signature.domain.event.ProviderConfigEvent;
import com.bank.signature.domain.model.ProviderConfigHistory;
import com.bank.signature.domain.port.outbound.ProviderConfigHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Provider Config Audit Listener
 * Story 13.9: Provider Audit Log & History
 * Epic 13: Providers CRUD Management
 * 
 * Listens to ProviderConfigEvent and records audit history.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderConfigAuditListener {
    
    private final ProviderConfigHistoryRepository historyRepository;
    
    @EventListener
    @Async
    public void handleProviderConfigEvent(ProviderConfigEvent event) {
        log.debug("Recording audit history for event: action={}, code={}", 
            event.action(), event.providerCode());
        
        try {
            // Build history record
            ProviderConfigHistory history = ProviderConfigHistory.builder()
                .id(UUID.randomUUID())
                .providerConfigId(event.providerConfigId())
                .changedAt(event.occurredAt())
                .changedBy(event.triggeredBy())
                .changeType(event.action().name())
                .oldConfigJson(new HashMap<>()) // Could extract from event if available
                .newConfigJson(event.changes() != null ? event.changes() : new HashMap<>())
                .remarks(event.reason())
                .build();
            
            // Save to database
            historyRepository.save(history);
            
            log.info("Audit history recorded: providerCode={}, action={}", 
                event.providerCode(), event.action());
            
        } catch (Exception e) {
            log.error("Failed to record audit history for event: {}", event, e);
        }
    }
}


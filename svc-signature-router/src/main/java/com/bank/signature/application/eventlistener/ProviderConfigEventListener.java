package com.bank.signature.application.eventlistener;

import com.bank.signature.domain.event.ProviderConfigEvent;
import com.bank.signature.domain.service.ProviderRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Provider Config Event Listener
 * Story 13.6: Hot Reload Provider Registry
 * Epic 13: Providers CRUD Management
 * 
 * Listens to ProviderConfigEvent and triggers registry reload.
 * 
 * Flow:
 * 1. Provider configuration changes (CRUD operation)
 * 2. Use case publishes ProviderConfigEvent
 * 3. This listener catches event
 * 4. Registry is reloaded from database
 * 5. New configuration is live without service restart
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderConfigEventListener {
    
    private final ProviderRegistry providerRegistry;
    
    @EventListener
    @Async
    public void handleProviderConfigEvent(ProviderConfigEvent event) {
        log.info("Received ProviderConfigEvent: action={}, code={}, type={}", 
            event.action(), event.providerCode(), event.providerType());
        
        try {
            // Reload registry to pick up changes
            providerRegistry.reload();
            
            log.info("Provider Registry reloaded successfully after {} event for provider: {}", 
                event.action(), event.providerCode());
            
        } catch (Exception e) {
            log.error("Failed to reload Provider Registry after event: {}", event, e);
        }
    }
}


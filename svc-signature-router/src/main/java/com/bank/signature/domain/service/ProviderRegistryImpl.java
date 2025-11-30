package com.bank.signature.domain.service;

import com.bank.signature.domain.model.ProviderConfig;
import com.bank.signature.domain.model.ProviderType;
import com.bank.signature.domain.port.outbound.ProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Provider Registry Implementation
 * Story 13.6: Hot Reload Provider Registry
 * Epic 13: Providers CRUD Management
 * 
 * Thread-safe in-memory cache of provider configurations.
 * Reloads automatically when providers change.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderRegistryImpl implements ProviderRegistry {
    
    private final ProviderConfigRepository repository;
    
    // Thread-safe concurrent maps for fast lookups
    private final Map<String, ProviderConfig> providersByCode = new ConcurrentHashMap<>();
    private final Map<ProviderType, List<ProviderConfig>> enabledProvidersByType = new ConcurrentHashMap<>();
    
    private volatile long lastReloadTimestamp = 0;
    
    @PostConstruct
    public void init() {
        log.info("Initializing Provider Registry");
        reload();
    }
    
    @Override
    public synchronized void reload() {
        log.info("Reloading Provider Registry from database");
        
        try {
            // Load all providers from database
            List<ProviderConfig> allProviders = repository.findAll();
            
            // Clear old cache
            providersByCode.clear();
            enabledProvidersByType.clear();
            
            // Build providersByCode map
            allProviders.forEach(provider -> 
                providersByCode.put(provider.getProviderCode(), provider)
            );
            
            // Build enabledProvidersByType map (ordered by priority)
            for (ProviderType type : ProviderType.values()) {
                List<ProviderConfig> enabledProviders = repository
                    .findByTypeAndEnabledOrderByPriority(type, true);
                
                enabledProvidersByType.put(type, enabledProviders);
            }
            
            lastReloadTimestamp = Instant.now().toEpochMilli();
            
            log.info("Provider Registry reloaded: {} total providers, {} enabled providers", 
                providersByCode.size(), 
                enabledProvidersByType.values().stream().mapToInt(List::size).sum());
            
            logRegistryStats();
            
        } catch (Exception e) {
            log.error("Failed to reload Provider Registry", e);
            throw new RuntimeException("Provider Registry reload failed", e);
        }
    }
    
    @Override
    public List<ProviderConfig> getEnabledProviders(ProviderType type) {
        List<ProviderConfig> providers = enabledProvidersByType.get(type);
        return providers != null ? List.copyOf(providers) : List.of();
    }
    
    @Override
    public Optional<ProviderConfig> getProviderByCode(String code) {
        return Optional.ofNullable(providersByCode.get(code));
    }
    
    @Override
    public List<ProviderConfig> getAllProviders() {
        return List.copyOf(providersByCode.values());
    }
    
    @Override
    public RegistryStats getStats() {
        int totalProviders = providersByCode.size();
        int enabledProviders = enabledProvidersByType.values().stream()
            .mapToInt(List::size)
            .sum();
        
        int smsProviders = enabledProvidersByType.getOrDefault(ProviderType.SMS, List.of()).size();
        int pushProviders = enabledProvidersByType.getOrDefault(ProviderType.PUSH, List.of()).size();
        int voiceProviders = enabledProvidersByType.getOrDefault(ProviderType.VOICE, List.of()).size();
        int biometricProviders = enabledProvidersByType.getOrDefault(ProviderType.BIOMETRIC, List.of()).size();
        
        return new RegistryStats(
            totalProviders,
            enabledProviders,
            smsProviders,
            pushProviders,
            voiceProviders,
            biometricProviders,
            lastReloadTimestamp
        );
    }
    
    private void logRegistryStats() {
        RegistryStats stats = getStats();
        
        log.info("Provider Registry Stats:");
        log.info("  Total Providers:      {}", stats.totalProviders());
        log.info("  Enabled Providers:    {}", stats.enabledProviders());
        log.info("  SMS Providers:        {}", stats.smsProviders());
        log.info("  PUSH Providers:       {}", stats.pushProviders());
        log.info("  VOICE Providers:      {}", stats.voiceProviders());
        log.info("  BIOMETRIC Providers:  {}", stats.biometricProviders());
    }
}


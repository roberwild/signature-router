package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.AggregatedHealthResponse;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ProviderHealthServiceImpl.
 * Story 3.7: Provider Health Check Endpoint
 */
@ExtendWith(MockitoExtension.class)
class ProviderHealthServiceImplTest {
    
    @Mock
    private ApplicationContext context;
    
    @Mock
    private SignatureProviderPort smsProvider;
    
    @Mock
    private SignatureProviderPort pushProvider;
    
    private ProviderHealthServiceImpl service;
    
    @BeforeEach
    void setUp() {
        service = new ProviderHealthServiceImpl(context, new SimpleMeterRegistry());
    }
    
    @Test
    @DisplayName("Should return UP when all providers are healthy")
    void shouldReturnUpWhenAllProvidersHealthy() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        providers.put("pushProvider", pushProvider);
        
        when(context.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.up("SMS operational"));
        when(pushProvider.checkHealth(any())).thenReturn(HealthStatus.up("Push operational"));
        
        // When
        AggregatedHealthResponse response = service.getProvidersHealth(false);
        
        // Then
        assertThat(response.overallStatus()).isEqualTo("UP");
        assertThat(response.providers()).hasSize(2);
    }
    
    @Test
    @DisplayName("Should return DOWN when all providers are unhealthy")
    void shouldReturnDownWhenAllProvidersUnhealthy() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        
        when(context.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.down("SMS down"));
        
        // When
        AggregatedHealthResponse response = service.getProvidersHealth(false);
        
        // Then
        assertThat(response.overallStatus()).isEqualTo("DOWN");
    }
    
    @Test
    @DisplayName("Should return DEGRADED when some providers are down")
    void shouldReturnDegradedWhenSomeProvidersDown() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        providers.put("pushProvider", pushProvider);
        
        when(context.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.up("SMS operational"));
        when(pushProvider.checkHealth(any())).thenReturn(HealthStatus.down("Push down"));
        
        // When
        AggregatedHealthResponse response = service.getProvidersHealth(false);
        
        // Then
        assertThat(response.overallStatus()).isEqualTo("DEGRADED");
    }
}


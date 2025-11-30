package com.bank.signature.infrastructure.health;

import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.ProviderType;
import com.bank.signature.domain.port.outbound.SignatureProviderPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.context.ApplicationContext;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ProviderHealthIndicator.
 * Story 3.6: Provider Configuration Management
 */
@ExtendWith(MockitoExtension.class)
class ProviderHealthIndicatorTest {
    
    @Mock
    private ApplicationContext applicationContext;
    
    @Mock
    private SignatureProviderPort smsProvider;
    
    @Mock
    private SignatureProviderPort pushProvider;
    
    private ProviderHealthIndicator healthIndicator;
    
    @BeforeEach
    void setUp() {
        healthIndicator = new ProviderHealthIndicator(applicationContext);
    }
    
    @Test
    @DisplayName("Should return UP when all providers are healthy")
    void shouldReturnUpWhenAllProvidersHealthy() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        providers.put("pushProvider", pushProvider);
        
        when(applicationContext.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.up("SMS operational"));
        when(pushProvider.checkHealth(any())).thenReturn(HealthStatus.up("Push operational"));
        
        // When
        Health health = healthIndicator.health();
        
        // Then
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsKeys("smsProvider", "pushProvider");
    }
    
    @Test
    @DisplayName("Should return DOWN when all providers are unhealthy")
    void shouldReturnDownWhenAllProvidersUnhealthy() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        providers.put("pushProvider", pushProvider);
        
        when(applicationContext.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.down("SMS down"));
        when(pushProvider.checkHealth(any())).thenReturn(HealthStatus.down("Push down"));
        
        // When
        Health health = healthIndicator.health();
        
        // Then
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsKey("message");
    }
    
    @Test
    @DisplayName("Should return DEGRADED when some providers are down")
    void shouldReturnDegradedWhenSomeProvidersDown() {
        // Given
        Map<String, SignatureProviderPort> providers = new HashMap<>();
        providers.put("smsProvider", smsProvider);
        providers.put("pushProvider", pushProvider);
        
        when(applicationContext.getBeansOfType(SignatureProviderPort.class)).thenReturn(providers);
        when(smsProvider.checkHealth(any())).thenReturn(HealthStatus.up("SMS operational"));
        when(pushProvider.checkHealth(any())).thenReturn(HealthStatus.down("Push down"));
        
        // When
        Health health = healthIndicator.health();
        
        // Then
        assertThat(health.getStatus()).isEqualTo(new Status("DEGRADED"));
        assertThat(health.getDetails()).containsKeys("smsProvider", "pushProvider", "message");
    }
    
    @Test
    @DisplayName("Should return DOWN when no providers found")
    void shouldReturnDownWhenNoProvidersFound() {
        // Given
        when(applicationContext.getBeansOfType(SignatureProviderPort.class)).thenReturn(new HashMap<>());
        
        // When
        Health health = healthIndicator.health();
        
        // Then
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsKey("message");
        assertThat(health.getDetails().get("message")).toString().contains("No signature providers available");
    }
}


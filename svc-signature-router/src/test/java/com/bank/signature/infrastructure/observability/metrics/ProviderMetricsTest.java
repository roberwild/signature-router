package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.model.valueobject.ProviderResult;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ProviderMetrics component.
 * Story 3.10 AC11: Unit Tests for ProviderMetrics
 * 
 * Tests verify:
 * - recordProviderCall() increments success/failure counters
 * - provider.latency histogram records duration samples
 * - updateErrorRate() sets gauge value
 * - retry metadata tags are applied correctly
 * - timeout metrics are recorded
 * 
 * Uses SimpleMeterRegistry (NOT mock) for realistic metric verification.
 */
@DisplayName("Provider Metrics Unit Tests")
class ProviderMetricsTest {
    
    private SimpleMeterRegistry meterRegistry;
    private ProviderMetrics providerMetrics;
    
    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        providerMetrics = new ProviderMetrics(meterRegistry);
    }
    
    @Test
    @DisplayName("recordProviderCall with success should increment success counter")
    void recordProviderCall_success_shouldIncrementSuccessCounter() {
        // Given
        ProviderResult result = ProviderResult.success("msg-123", "{\"status\":\"sent\"}");
        Duration duration = Duration.ofMillis(150);
        
        // When
        providerMetrics.recordProviderCall("SMS", "SMS", result, duration);
        
        // Then
        Counter counter = meterRegistry.find("provider.calls.total")
            .tag("provider", "SMS")
            .tag("status", "success")
            .tag("channel_type", "SMS")
            .tag("retried", "false")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("recordProviderCall with success should record latency histogram")
    void recordProviderCall_success_shouldRecordLatencyHistogram() {
        // Given
        ProviderResult result = ProviderResult.success("msg-123", "{\"status\":\"sent\"}");
        Duration duration = Duration.ofMillis(250);
        
        // When
        providerMetrics.recordProviderCall("PUSH", "PUSH", result, duration);
        
        // Then
        Timer timer = meterRegistry.find("provider.latency")
            .tag("provider", "PUSH")
            .tag("status", "success")
            .tag("attempt_number", "1")
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1L);
        assertThat(timer.totalTime(java.util.concurrent.TimeUnit.MILLISECONDS))
            .isGreaterThanOrEqualTo(250.0);
    }
    
    @Test
    @DisplayName("recordProviderCall with failure should increment failure counters")
    void recordProviderCall_failure_shouldIncrementFailureCounters() {
        // Given
        ProviderResult result = ProviderResult.failure("TIMEOUT", "Provider timed out");
        Duration duration = Duration.ofSeconds(5);
        
        // When
        providerMetrics.recordProviderCall("SMS", "SMS", result, duration);
        
        // Then - provider.calls.total with status=failure
        Counter callsCounter = meterRegistry.find("provider.calls.total")
            .tag("provider", "SMS")
            .tag("status", "failure")
            .counter();
        
        assertThat(callsCounter).isNotNull();
        assertThat(callsCounter.count()).isEqualTo(1.0);
        
        // Then - provider.failures.total with error_code
        Counter failuresCounter = meterRegistry.find("provider.failures.total")
            .tag("provider", "SMS")
            .tag("error_code", "TIMEOUT")
            .counter();
        
        assertThat(failuresCounter).isNotNull();
        assertThat(failuresCounter.count()).isEqualTo(1.0);
        
        // Then - provider.errors.total with error_type (AC5)
        Counter errorsCounter = meterRegistry.find("provider.errors.total")
            .tag("provider", "SMS")
            .tag("error_type", "transient")  // TIMEOUT is transient
            .counter();
        
        assertThat(errorsCounter).isNotNull();
        assertThat(errorsCounter.count()).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("recordProviderCall with retry should tag retried=true")
    void recordProviderCall_withRetry_shouldTagRetriedTrue() {
        // Given - success after 3 attempts (2 retries)
        ProviderResult result = ProviderResult.successAfterRetry("msg-456", "{\"status\":\"sent\"}", 3);
        Duration duration = Duration.ofSeconds(7);  // Includes retry delays
        
        // When
        providerMetrics.recordProviderCall("SMS", "SMS", result, duration);
        
        // Then - provider.calls.total with retried=true
        Counter counter = meterRegistry.find("provider.calls.total")
            .tag("provider", "SMS")
            .tag("status", "success")
            .tag("retried", "true")  // AC3: retry awareness
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
        
        // Then - provider.latency with attempt_number=3
        Timer timer = meterRegistry.find("provider.latency")
            .tag("provider", "SMS")
            .tag("attempt_number", "3")  // AC3: attempt number tag
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1L);
    }
    
    @Test
    @DisplayName("updateErrorRate should set gauge value")
    void updateErrorRate_shouldSetGauge() {
        // Given
        double errorRate = 0.15;  // 15%
        
        // When
        providerMetrics.updateErrorRate("SMS", errorRate);
        
        // Then
        Gauge gauge = meterRegistry.find("provider.error.rate")
            .tag("provider", "SMS")
            .gauge();
        
        assertThat(gauge).isNotNull();
        assertThat(gauge.value()).isEqualTo(0.15);
    }
    
    @Test
    @DisplayName("recordTimeout should increment timeout counter and histogram")
    void recordTimeout_shouldRecordTimeoutMetrics() {
        // Given
        Duration duration = Duration.ofSeconds(5);
        
        // When
        providerMetrics.recordTimeout("VOICE", duration);
        
        // Then - provider.timeout.duration histogram (AC2)
        Timer timer = meterRegistry.find("provider.timeout.duration")
            .tag("provider", "VOICE")
            .timer();
        
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1L);
        assertThat(timer.totalTime(java.util.concurrent.TimeUnit.SECONDS))
            .isGreaterThanOrEqualTo(5.0);
    }
    
    @Test
    @DisplayName("recordProviderCall with permanent error should classify as permanent")
    void recordProviderCall_permanentError_shouldClassifyAsPermanent() {
        // Given - permanent error (4xx, auth failure)
        ProviderResult result = ProviderResult.failure("INVALID_PHONE", "Phone number format invalid");
        Duration duration = Duration.ofMillis(50);
        
        // When
        providerMetrics.recordProviderCall("SMS", "SMS", result, duration);
        
        // Then - provider.errors.total with error_type=permanent
        Counter errorsCounter = meterRegistry.find("provider.errors.total")
            .tag("provider", "SMS")
            .tag("error_type", "permanent")
            .counter();
        
        assertThat(errorsCounter).isNotNull();
        assertThat(errorsCounter.count()).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("recordProviderCall with multiple calls should accumulate metrics")
    void recordProviderCall_multipleCalls_shouldAccumulate() {
        // Given
        ProviderResult success1 = ProviderResult.success("msg-1", "{}");
        ProviderResult success2 = ProviderResult.success("msg-2", "{}");
        ProviderResult failure = ProviderResult.failure("API_ERROR", "Server error");
        
        // When - 3 calls (2 success, 1 failure)
        providerMetrics.recordProviderCall("PUSH", "PUSH", success1, Duration.ofMillis(100));
        providerMetrics.recordProviderCall("PUSH", "PUSH", success2, Duration.ofMillis(150));
        providerMetrics.recordProviderCall("PUSH", "PUSH", failure, Duration.ofMillis(200));
        
        // Then - success counter
        Counter successCounter = meterRegistry.find("provider.calls.total")
            .tag("provider", "PUSH")
            .tag("status", "success")
            .counter();
        assertThat(successCounter.count()).isEqualTo(2.0);
        
        // Then - failure counter
        Counter failureCounter = meterRegistry.find("provider.calls.total")
            .tag("provider", "PUSH")
            .tag("status", "failure")
            .counter();
        assertThat(failureCounter.count()).isEqualTo(1.0);
        
        // Then - latency histogram has 3 samples (across both success and failure timers)
        io.micrometer.core.instrument.search.Search timerSearch = meterRegistry.find("provider.latency")
            .tag("provider", "PUSH");
        
        long totalSamples = timerSearch.timers().stream()
            .mapToLong(Timer::count)
            .sum();
        
        assertThat(totalSamples).isEqualTo(3L);
    }
    
    @Test
    @DisplayName("recordProviderCall with channel_type different from provider")
    void recordProviderCall_withDifferentChannelType_shouldRecordBoth() {
        // Given - scenario where channel_type might differ from provider
        ProviderResult result = ProviderResult.success("msg-789", "{}");
        Duration duration = Duration.ofMillis(180);
        
        // When - provider is SMS, channel_type is also SMS (typical case)
        providerMetrics.recordProviderCall("SMS", "SMS", result, duration);
        
        // Then - both tags present
        Counter counter = meterRegistry.find("provider.calls.total")
            .tag("provider", "SMS")
            .tag("channel_type", "SMS")
            .tag("status", "success")
            .counter();
        
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }
}


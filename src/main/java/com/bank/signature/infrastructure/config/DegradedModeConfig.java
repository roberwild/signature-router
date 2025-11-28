package com.bank.signature.infrastructure.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Configuration for system degraded mode detection and recovery.
 * 
 * <p>Properties:
 * <ul>
 * <li>enabled: Enable/disable degraded mode feature</li>
 * <li>errorRateThreshold: Error rate % threshold to enter degraded mode (default: 80%)</li>
 * <li>minDuration: Min duration of high error rate before entering degraded (default: 2min)</li>
 * <li>recoveryThreshold: Error rate % threshold to exit degraded mode (default: 50%)</li>
 * <li>recoveryDuration: Min duration of low error rate before exiting degraded (default: 5min)</li>
 * <li>circuitOpenThreshold: Number of OPEN circuit breakers to trigger degraded (default: 3)</li>
 * </ul>
 * 
 * <p><strong>Configuration Example:</strong>
 * <pre>
 * degraded-mode:
 *   enabled: true
 *   error-rate-threshold: 80  # %
 *   min-duration: 120s
 *   recovery-threshold: 50  # %
 *   recovery-duration: 300s
 *   circuit-open-threshold: 3  # providers
 * </pre>
 * 
 * @since Story 4.3 - Degraded Mode Manager
 */
@Configuration
@ConfigurationProperties(prefix = "degraded-mode")
@Data
@Validated
public class DegradedModeConfig {
    
    /**
     * Enable or disable degraded mode feature.
     * Default: true
     */
    private boolean enabled = true;
    
    /**
     * Error rate threshold (%) to enter degraded mode.
     * Range: 50-100
     * Default: 80 (80%)
     */
    @Min(50)
    @Max(100)
    private int errorRateThreshold = 80;
    
    /**
     * Minimum duration of high error rate before entering degraded mode.
     * Prevents flapping from temporary spikes.
     * Default: 2 minutes (120s)
     */
    private Duration minDuration = Duration.ofSeconds(120);
    
    /**
     * Error rate threshold (%) to exit degraded mode (recovery).
     * Should be lower than errorRateThreshold to prevent flapping.
     * Range: 10-80
     * Default: 50 (50%)
     */
    @Min(10)
    @Max(80)
    private int recoveryThreshold = 50;
    
    /**
     * Minimum duration of low error rate before exiting degraded mode.
     * Ensures stability before returning to normal operation.
     * Default: 5 minutes (300s)
     */
    private Duration recoveryDuration = Duration.ofSeconds(300);
    
    /**
     * Number of circuit breakers OPEN to trigger degraded mode.
     * If >= this many providers have circuit OPEN, enter degraded mode.
     * Range: 1-4 (max 4 providers: SMS, PUSH, VOICE, BIOMETRIC)
     * Default: 3
     */
    @Min(1)
    @Max(4)
    private int circuitOpenThreshold = 3;
}


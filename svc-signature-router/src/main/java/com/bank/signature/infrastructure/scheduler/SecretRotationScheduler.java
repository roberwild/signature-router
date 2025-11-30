package com.bank.signature.infrastructure.scheduler;

import com.bank.signature.domain.port.outbound.SecretRotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Scheduled job for automatic secret rotation.
 * Story 8.5: Vault Secret Rotation
 * 
 * <p><b>Schedule:</b></p>
 * <ul>
 *   <li>Pseudonymization key: Every 90 days (or manual trigger)</li>
 *   <li>Database credentials: Managed by Vault (1 hour TTL)</li>
 *   <li>Verification: Daily health check</li>
 * </ul>
 * 
 * <p>This scheduler is only enabled when the property 
 * {@code vault.rotation.enabled=true} is set.</p>
 * 
 * @since Story 8.5
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "vault.rotation.enabled", havingValue = "true", matchIfMissing = false)
public class SecretRotationScheduler {
    
    private final SecretRotationService secretRotationService;
    
    /**
     * Rotates pseudonymization key every 90 days.
     * Cron expression: Every 3 months on the 1st at 2:00 AM
     * For testing use fixedDelay
     */
    @Scheduled(cron = "${vault.rotation.pseudonymization.cron:0 0 2 1 */3 *}")

    public void rotatePseudonymizationKey() {
        log.info("⏰ Scheduled pseudonymization key rotation started at {}", Instant.now());
        
        try {
            secretRotationService.rotatePseudonymizationKey();
            log.info("✅ Scheduled pseudonymization key rotation completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Scheduled pseudonymization key rotation failed: {}", e.getMessage(), e);
            // TODO: Send alert to monitoring system (e.g., Prometheus, PagerDuty)
        }
    }
    
    /**
     * Verifies secret rotation health daily.
     * Cron: 0 0 * * * * (Every day at midnight)
     */
    @Scheduled(cron = "${vault.rotation.verification.cron:0 0 0 * * *}") // Daily at midnight
    public void verifySecretRotation() {
        log.info("⏰ Scheduled secret rotation verification started at {}", Instant.now());
        
        try {
            // Check if rotation is due
            boolean isDue = secretRotationService.isRotationDue();
            
            if (isDue) {
                log.warn("⚠️ Secret rotation is DUE - consider rotating soon");
                // TODO: Send alert to monitoring system
            } else {
                log.info("✅ Secret rotation not due yet");
            }
            
            // Verify current key version exists
            int currentVersion = secretRotationService.getCurrentKeyVersion();
            log.info("✅ Current secret key version: {}", currentVersion);
            
        } catch (Exception e) {
            log.error("❌ Secret rotation verification error: {}", e.getMessage(), e);
            // TODO: Send alert to monitoring system
        }
    }
    
    /**
     * Manual trigger for immediate rotation (for testing or emergency rotation).
     * This method can be called via JMX or custom endpoint.
     */
    public void triggerImmediateRotation() {
        log.warn("⚠️ MANUAL rotation triggered at {}", Instant.now());
        
        try {
            secretRotationService.rotatePseudonymizationKey();
            log.info("✅ Manual rotation completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Manual rotation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Manual rotation failed", e);
        }
    }
}


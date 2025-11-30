package com.bank.signature.domain.model.valueobject;

/**
 * System operational mode for graceful degradation.
 * 
 * <p><b>Mode Transitions:</b></p>
 * <pre>
 * NORMAL → DEGRADED (when providers fail massively)
 * DEGRADED → NORMAL (when error rate normalizes)
 * ANY → MAINTENANCE (manual admin override)
 * MAINTENANCE → NORMAL (manual admin override)
 * </pre>
 * 
 * <p><b>Behavior by Mode:</b></p>
 * <ul>
 * <li>NORMAL: All features operational, challenges sent immediately</li>
 * <li>DEGRADED: System accepts requests (HTTP 202) but queues challenges for retry</li>
 * <li>MAINTENANCE: System rejects new requests, scheduled maintenance</li>
 * </ul>
 * 
 * @since Story 4.3 - Degraded Mode Manager
 */
public enum SystemMode {
    /**
     * Normal operation - all providers functioning.
     * Challenges sent immediately, HTTP 201 Created responses.
     */
    NORMAL,
    
    /**
     * Degraded operation - providers failing massively (error rate > threshold).
     * Requests accepted (HTTP 202 Accepted) but challenges queued for retry when recovery.
     * System remains operational with reduced functionality.
     */
    DEGRADED,
    
    /**
     * Maintenance mode - manual override by admin.
     * System may reject new requests, used for planned maintenance windows.
     */
    MAINTENANCE
}


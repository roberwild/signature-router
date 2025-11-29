package com.bank.signature.domain.port.outbound;

import com.bank.signature.domain.model.event.AuditEvent;

/**
 * Port for logging audit events to immutable storage.
 * Story 8.4: Audit Log - Immutable Storage
 * 
 * <p><b>Purpose:</b> Provide a domain-level interface for audit logging,
 * decoupling the domain from infrastructure concerns (hexagonal architecture).</p>
 * 
 * <p><b>Implementation:</b> PostgreSQL with insert-only table (immutable).</p>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>SOC 2 CC7.2: Monitor system components and changes</li>
 *   <li>PCI-DSS Req 10: Track and monitor all access to network resources and cardholder data</li>
 *   <li>GDPR Art. 30: Maintain records of processing activities</li>
 * </ul>
 * 
 * @since Story 8.4
 */
public interface AuditService {
    
    /**
     * Logs an audit event to immutable storage.
     * 
     * <p><b>Characteristics:</b></p>
     * <ul>
     *   <li>Asynchronous (non-blocking, fire-and-forget)</li>
     *   <li>Immutable (INSERT-only, no UPDATE/DELETE allowed)</li>
     *   <li>Persistent (retained for 365 days minimum)</li>
     * </ul>
     * 
     * <p><b>Use Cases:</b></p>
     * <ul>
     *   <li>Security events (access denied, authentication failed)</li>
     *   <li>Data modifications (signature created, routing rule modified)</li>
     *   <li>GDPR compliance (data exported, data deleted)</li>
     * </ul>
     * 
     * @param event The audit event to log
     */
    void log(AuditEvent event);
}


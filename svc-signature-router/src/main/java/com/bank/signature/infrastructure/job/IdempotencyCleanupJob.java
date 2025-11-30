package com.bank.signature.infrastructure.job;

import com.bank.signature.application.service.IdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job for cleaning up expired idempotency records.
 * Story 10.5: Idempotency Functional
 * 
 * <p><b>Execution Schedule:</b> Every hour (cron: "0 0 * * * *")</p>
 * 
 * <p><b>Process:</b></p>
 * <ol>
 *   <li>Delete all idempotency records where expiresAt < NOW()</li>
 *   <li>Log number of deleted records</li>
 *   <li>Record metrics (if needed)</li>
 * </ol>
 * 
 * <p><b>Performance Considerations:</b></p>
 * <ul>
 *   <li>Uses batch delete query (efficient for large datasets)</li>
 *   <li>Index on expires_at ensures fast query execution</li>
 *   <li>Job is idempotent (can run multiple times safely)</li>
 * </ul>
 * 
 * @since Story 10.5
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyCleanupJob {
    
    private final IdempotencyService idempotencyService;
    
    /**
     * Scheduled job that cleans up expired idempotency records.
     * 
     * <p>Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00).
     * Uses cron expression: "0 0 * * * *" (second=0, minute=0, every hour)</p>
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupExpiredRecords() {
        log.debug("Starting idempotency cleanup job...");
        
        try {
            int deleted = idempotencyService.cleanupExpiredRecords();
            
            if (deleted > 0) {
                log.info("Idempotency cleanup completed: {} expired records deleted", deleted);
            } else {
                log.debug("Idempotency cleanup completed: no expired records found");
            }
            
        } catch (Exception e) {
            log.error("Error during idempotency cleanup job", e);
            // Don't throw - allow job to complete and retry on next run
        }
    }
}


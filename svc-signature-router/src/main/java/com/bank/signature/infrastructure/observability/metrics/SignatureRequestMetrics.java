package com.bank.signature.infrastructure.observability.metrics;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Metrics component for signature request business metrics.
 * 
 * <p>Records Prometheus metrics for:
 * - signature.requests.created.total (Counter): Total requests created by channel
 * - signature.requests.completed.total (Counter): Total requests completed by status
 * - signature.requests.duration.seconds (Histogram): Duration from creation to completion
 * 
 * <p><b>GDPR Compliance:</b> No PII (customer IDs) exposed in metric tags
 * 
 * <p>Story 9.2: Prometheus Metrics Export (AC2)
 * 
 * @author Signature Router Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SignatureRequestMetrics {

    private final MeterRegistry meterRegistry;

    /**
     * Records signature request creation metrics.
     * 
     * <p>Increments counter: signature.requests.created.total
     * Tags:
     * - channel: SMS|PUSH|VOICE|BIOMETRIC
     * 
     * <p><b>GDPR Note:</b> Customer IDs are NOT exposed in metrics to maintain privacy
     * 
     * <p>Example metric:
     * <pre>
     * signature_requests_created_total{channel="SMS"} 5.0
     * </pre>
     * 
     * @param request the created signature request
     */
    public void recordCreated(SignatureRequest request) {
        try {
            // Get channel from the first routing timeline entry
            String channel = request.getRoutingTimeline().isEmpty() 
                ? "UNKNOWN" 
                : request.getRoutingTimeline().get(0).toChannel().name();
            
            Counter.builder("signature.requests.created.total")
                .description("Total signature requests created")
                .tag("channel", channel)
                .register(meterRegistry)
                .increment();
            
            log.debug("Recorded signature request created: id={}, channel={}", 
                request.getId(), channel);
                
        } catch (Exception e) {
            log.error("Failed to record signature request created metric: id={}", request.getId(), e);
        }
    }

    /**
     * Records signature request completion metrics.
     * 
     * <p>Increments counter: signature.requests.completed.total
     * Tags:
     * - status: SIGNED|FAILED|EXPIRED|ABORTED
     * 
     * <p>Records histogram: signature.requests.duration.seconds
     * Duration calculated from createdAt to signedAt/abortedAt (or now if null).
     * Buckets configured in application.yml: 10s, 30s, 1min, 5min, 10min, 30min, 1h, 24h
     * 
     * <p>Example metrics:
     * <pre>
     * signature_requests_completed_total{status="SIGNED"} 10.0
     * signature_requests_duration_seconds_count 10
     * signature_requests_duration_seconds_sum 1250.5
     * signature_requests_duration_seconds{quantile="0.99"} 180.5
     * </pre>
     * 
     * @param request the completed signature request
     */
    public void recordCompleted(SignatureRequest request) {
        try {
            // Increment completion counter
            Counter.builder("signature.requests.completed.total")
                .description("Total signature requests completed")
                .tag("status", request.getStatus().name())
                .register(meterRegistry)
                .increment();
            
            // Record duration histogram
            // Use signedAt for SIGNED status, abortedAt for ABORTED status, or now() as fallback
            Instant completedAt;
            if (request.getSignedAt() != null) {
                completedAt = request.getSignedAt();
            } else if (request.getAbortedAt() != null) {
                completedAt = request.getAbortedAt();
            } else {
                completedAt = Instant.now();
            }
            
            Duration duration = Duration.between(request.getCreatedAt(), completedAt);
            
            Timer.builder("signature.requests.duration.seconds")
                .description("Duration of signature requests from creation to completion")
                .register(meterRegistry)
                .record(duration.toMillis(), TimeUnit.MILLISECONDS);
            
            log.debug("Recorded signature request completed: id={}, status={}, duration={}s", 
                request.getId(), request.getStatus(), duration.getSeconds());
                
        } catch (Exception e) {
            log.error("Failed to record signature request completed metric: id={}", request.getId(), e);
        }
    }
}


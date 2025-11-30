package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.response.DashboardMetricsResponse;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.*;
import com.bank.signature.application.service.ProviderHealthService;
import com.bank.signature.domain.model.valueobject.Channel;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of Get Dashboard Metrics Use Case
 * Story 12.1: Dashboard Metrics Endpoint
 * 
 * Aggregates metrics from SignatureRequestRepository and ProviderHealthService.
 * Results are cached for 1 minute to avoid expensive queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetDashboardMetricsUseCaseImpl implements GetDashboardMetricsUseCase {
    
    private final SignatureRequestRepository signatureRequestRepository;
    private final ProviderHealthService providerHealthService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    
    /**
     * Execute dashboard metrics aggregation
     * 
     * Cached for 60 seconds to balance freshness with performance.
     * Cache key: "dashboardMetrics" (single entry)
     * 
     * @return Aggregated dashboard metrics
     */
    @Override
    @Cacheable(value = "dashboardMetrics", unless = "#result == null")
    public DashboardMetricsResponse execute() {
        log.info("Computing dashboard metrics (cache miss or expired)");
        
        Instant now = Instant.now();
        Instant last24h = now.minusSeconds(24 * 60 * 60);
        Instant last7d = now.minusSeconds(7 * 24 * 60 * 60);
        Instant last30d = now.minusSeconds(30 * 24 * 60 * 60);
        
        // Overview metrics
        OverviewMetrics overview = computeOverviewMetrics(last24h, last7d, last30d, now);
        
        // Channel metrics
        Map<String, ChannelMetrics> byChannel = computeChannelMetrics(last30d, now);
        
        // Latency timeline (last 7 days)
        List<LatencyTimelinePoint> latencyTimeline = computeLatencyTimeline(last7d, now);
        
        // Error timeline (last 7 days)
        List<ErrorTimelinePoint> errorTimeline = computeErrorTimeline(last7d, now);
        
        log.info("Dashboard metrics computed: total24h={}, successRate={}, activeProviders={}/{}",
            overview.totalSignatures24h(),
            overview.successRate(),
            overview.activeProviders(),
            overview.totalProviders()
        );
        
        return DashboardMetricsResponse.builder()
            .overview(overview)
            .byChannel(byChannel)
            .latencyTimeline(latencyTimeline)
            .errorTimeline(errorTimeline)
            .build();
    }
    
    /**
     * Compute overview metrics
     */
    private OverviewMetrics computeOverviewMetrics(Instant last24h, Instant last7d, Instant last30d, Instant now) {
        // Count signatures by time range
        long total24h = signatureRequestRepository.countByCreatedAtBetween(last24h, now);
        long total7d = signatureRequestRepository.countByCreatedAtBetween(last7d, now);
        long total30d = signatureRequestRepository.countByCreatedAtBetween(last30d, now);
        
        // Success rate (last 30 days)
        long successfulCount = signatureRequestRepository.countByStatusAndCreatedAtBetween(
            SignatureStatus.VALIDATED, last30d, now
        );
        double successRate = total30d > 0 ? (successfulCount * 100.0 / total30d) : 0.0;
        
        // Average latency (last 30 days)
        // TODO: Implement latency calculation from metrics or event sourcing
        // For now, using a placeholder
        long avgLatency = 245L; // Placeholder
        
        // Provider health
        var healthResponse = providerHealthService.getProvidersHealth(false);
        int totalProviders = healthResponse.providers().size();
        int activeProviders = (int) healthResponse.providers().stream()
            .filter(p -> "UP".equals(p.status()))
            .count();
        
        return OverviewMetrics.builder()
            .totalSignatures24h(total24h)
            .totalSignatures7d(total7d)
            .totalSignatures30d(total30d)
            .successRate(Math.round(successRate * 10.0) / 10.0) // Round to 1 decimal
            .avgLatency(avgLatency)
            .activeProviders(activeProviders)
            .totalProviders(totalProviders)
            .build();
    }
    
    /**
     * Compute metrics by channel
     */
    private Map<String, ChannelMetrics> computeChannelMetrics(Instant from, Instant to) {
        Map<String, ChannelMetrics> metrics = new HashMap<>();
        
        for (Channel channel : Channel.values()) {
            long totalCount = signatureRequestRepository.countByChannelAndCreatedAtBetween(
                channel, from, to
            );
            
            if (totalCount > 0) {
                long successCount = signatureRequestRepository
                    .countByChannelAndStatusAndCreatedAtBetween(
                        channel, SignatureStatus.VALIDATED, from, to
                    );
                
                double successRate = (successCount * 100.0 / totalCount);
                
                // TODO: Implement channel-specific latency from metrics
                long avgLatency = getPlaceholderLatency(channel);
                
                metrics.put(channel.name(), ChannelMetrics.builder()
                    .count(totalCount)
                    .successRate(Math.round(successRate * 10.0) / 10.0)
                    .avgLatency(avgLatency)
                    .build());
            }
        }
        
        return metrics;
    }
    
    /**
     * Compute latency timeline (last 7 days)
     */
    private List<LatencyTimelinePoint> computeLatencyTimeline(Instant from, Instant to) {
        List<LatencyTimelinePoint> timeline = new ArrayList<>();
        
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            // TODO: Implement actual latency metrics from observability system
            // For now, using placeholders
            timeline.add(LatencyTimelinePoint.builder()
                .date(date.format(DATE_FORMATTER))
                .p50(145 + (long)(Math.random() * 10))
                .p95(410 + (long)(Math.random() * 30))
                .p99(740 + (long)(Math.random() * 60))
                .build());
        }
        
        return timeline;
    }
    
    /**
     * Compute error rate timeline (last 7 days)
     */
    private List<ErrorTimelinePoint> computeErrorTimeline(Instant from, Instant to) {
        List<ErrorTimelinePoint> timeline = new ArrayList<>();
        
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            
            long totalCount = signatureRequestRepository.countByCreatedAtBetween(dayStart, dayEnd);
            
            if (totalCount > 0) {
                long failedCount = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                    SignatureStatus.FAILED, dayStart, dayEnd
                );
                
                long expiredCount = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                    SignatureStatus.EXPIRED, dayStart, dayEnd
                );
                
                double errorRate = ((failedCount + expiredCount) * 100.0 / totalCount);
                
                timeline.add(ErrorTimelinePoint.builder()
                    .date(date.format(DATE_FORMATTER))
                    .errorRate(Math.round(errorRate * 10.0) / 10.0)
                    .build());
            } else {
                timeline.add(ErrorTimelinePoint.builder()
                    .date(date.format(DATE_FORMATTER))
                    .errorRate(0.0)
                    .build());
            }
        }
        
        return timeline;
    }
    
    /**
     * Placeholder latency by channel (until metrics system is integrated)
     */
    private long getPlaceholderLatency(Channel channel) {
        return switch (channel) {
            case SMS -> 180L;
            case PUSH -> 120L;
            case VOICE -> 450L;
            case BIOMETRIC -> 90L;
        };
    }
}


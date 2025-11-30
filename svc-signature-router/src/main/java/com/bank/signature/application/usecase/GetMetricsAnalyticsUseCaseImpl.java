package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.response.MetricsAnalyticsResponse;
import com.bank.signature.application.dto.response.MetricsAnalyticsResponse.*;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of Get Metrics Analytics Use Case
 * Story 12.4: Metrics Analytics Endpoint
 * 
 * Provides advanced metrics analytics with latency, throughput, and error rates.
 * Results are cached for 5 minutes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetMetricsAnalyticsUseCaseImpl implements GetMetricsAnalyticsUseCase {
    
    private final SignatureRequestRepository signatureRequestRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    
    /**
     * Execute metrics analytics computation
     * 
     * Cached for 5 minutes to balance freshness with performance.
     * 
     * @param range   Time range (1d, 7d, 30d)
     * @param channel Optional channel filter
     * @return Metrics analytics response
     */
    @Override
    @Cacheable(value = "metricsAnalytics", key = "#range + '_' + (#channel != null ? #channel.name() : 'all')")
    public MetricsAnalyticsResponse execute(String range, Channel channel) {
        log.info("Computing metrics analytics: range={}, channel={}", range, channel);
        
        Instant now = Instant.now();
        Instant from = calculateFromTime(range, now);
        
        // Compute metrics
        LatencyMetrics latency = computeLatencyMetrics(from, now, channel);
        ThroughputMetrics throughput = computeThroughputMetrics(from, now, channel);
        ErrorRateMetrics errorRate = computeErrorRateMetrics(from, now, channel);
        
        log.info("Metrics analytics computed for range={}, channel={}", range, channel);
        
        return MetricsAnalyticsResponse.builder()
            .range(range)
            .latency(latency)
            .throughput(throughput)
            .errorRate(errorRate)
            .build();
    }
    
    /**
     * Calculate from timestamp based on range
     */
    private Instant calculateFromTime(String range, Instant now) {
        return switch (range) {
            case "1d" -> now.minus(1, ChronoUnit.DAYS);
            case "7d" -> now.minus(7, ChronoUnit.DAYS);
            case "30d" -> now.minus(30, ChronoUnit.DAYS);
            default -> now.minus(7, ChronoUnit.DAYS); // Default to 7d
        };
    }
    
    /**
     * Compute latency metrics
     */
    private LatencyMetrics computeLatencyMetrics(Instant from, Instant to, Channel channel) {
        // TODO: Integrate with Micrometer metrics when available
        // For now, using placeholder values
        
        LatencyMetrics.CurrentLatency current = LatencyMetrics.CurrentLatency.builder()
            .p50(150)
            .p95(450)
            .p99(780)
            .build();
        
        List<LatencyMetrics.LatencyTimelinePoint> timeline = new ArrayList<>();
        
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            timeline.add(LatencyMetrics.LatencyTimelinePoint.builder()
                .date(date.format(DATE_FORMATTER))
                .p50(145 + (long)(Math.random() * 15))
                .p95(410 + (long)(Math.random() * 40))
                .p99(740 + (long)(Math.random() * 80))
                .build());
        }
        
        return LatencyMetrics.builder()
            .current(current)
            .timeline(timeline)
            .build();
    }
    
    /**
     * Compute throughput metrics
     */
    private ThroughputMetrics computeThroughputMetrics(Instant from, Instant to, Channel channel) {
        // Calculate current throughput (requests per minute)
        long totalRequests = channel != null
            ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
            : signatureRequestRepository.countByCreatedAtBetween(from, to);
        
        long minutesDiff = ChronoUnit.MINUTES.between(from, to);
        double currentThroughput = minutesDiff > 0 ? (double) totalRequests / minutesDiff : 0.0;
        
        // Calculate timeline
        List<ThroughputMetrics.ThroughputTimelinePoint> timeline = new ArrayList<>();
        
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            
            long dayRequests = channel != null
                ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
                : signatureRequestRepository.countByCreatedAtBetween(dayStart, dayEnd);
            
            double requestsPerMinute = dayRequests / (24.0 * 60.0); // Average per minute for the day
            
            timeline.add(ThroughputMetrics.ThroughputTimelinePoint.builder()
                .date(date.format(DATE_FORMATTER))
                .requestsPerMinute(Math.round(requestsPerMinute * 10.0) / 10.0)
                .build());
        }
        
        return ThroughputMetrics.builder()
            .current(Math.round(currentThroughput * 10.0) / 10.0)
            .timeline(timeline)
            .build();
    }
    
    /**
     * Compute error rate metrics
     */
    private ErrorRateMetrics computeErrorRateMetrics(Instant from, Instant to, Channel channel) {
        // Calculate overall error rate
        long totalRequests = channel != null
            ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
            : signatureRequestRepository.countByCreatedAtBetween(from, to);
        
        long failedRequests = channel != null
            ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
            : signatureRequestRepository.countByStatusAndCreatedAtBetween(SignatureStatus.FAILED, from, to);
        
        long expiredRequests = channel != null
            ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
            : signatureRequestRepository.countByStatusAndCreatedAtBetween(SignatureStatus.EXPIRED, from, to);
        
        double overallErrorRate = totalRequests > 0
            ? ((failedRequests + expiredRequests) * 100.0 / totalRequests)
            : 0.0;
        
        // Calculate error rate by channel (if no channel filter)
        Map<String, Double> byChannel = new HashMap<>();
        if (channel == null) {
            for (Channel ch : Channel.values()) {
                long channelTotal = 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */;
                if (channelTotal > 0) {
                    long channelFailed = 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */;
                    long channelExpired = 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */;
                    double channelErrorRate = (channelFailed + channelExpired) * 100.0 / channelTotal;
                    byChannel.put(ch.name(), Math.round(channelErrorRate * 10.0) / 10.0);
                }
            }
        }
        
        // Calculate timeline
        List<ErrorRateMetrics.ErrorRateTimelinePoint> timeline = new ArrayList<>();
        
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            
            long dayTotal = channel != null
                ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
                : signatureRequestRepository.countByCreatedAtBetween(dayStart, dayEnd);
            
            if (dayTotal > 0) {
                long dayFailed = channel != null
                    ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
                    : signatureRequestRepository.countByStatusAndCreatedAtBetween(SignatureStatus.FAILED, dayStart, dayEnd);
                
                long dayExpired = channel != null
                    ? 0L /* TODO: SignatureRequestEntity no tiene campo 'channel' */
                    : signatureRequestRepository.countByStatusAndCreatedAtBetween(SignatureStatus.EXPIRED, dayStart, dayEnd);
                
                double dayErrorRate = (dayFailed + dayExpired) * 100.0 / dayTotal;
                
                timeline.add(ErrorRateMetrics.ErrorRateTimelinePoint.builder()
                    .date(date.format(DATE_FORMATTER))
                    .errorRate(Math.round(dayErrorRate * 10.0) / 10.0)
                    .build());
            } else {
                timeline.add(ErrorRateMetrics.ErrorRateTimelinePoint.builder()
                    .date(date.format(DATE_FORMATTER))
                    .errorRate(0.0)
                    .build());
            }
        }
        
        return ErrorRateMetrics.builder()
            .overall(Math.round(overallErrorRate * 10.0) / 10.0)
            .byChannel(byChannel)
            .timeline(timeline)
            .build();
    }
}


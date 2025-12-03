package com.bank.signature.application.usecase;

import com.bank.signature.application.dto.response.MetricsAnalyticsResponse;
import com.bank.signature.application.dto.response.MetricsAnalyticsResponse.*;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.Channel;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        SignatureDurationMetrics signatureDuration = computeSignatureDurationMetrics(from, now, range);
        ChallengeCompletionMetrics challengeCompletion = computeChallengeCompletionMetrics(from, now);
        
        log.info("Metrics analytics computed for range={}, channel={}", range, channel);
        
        return MetricsAnalyticsResponse.builder()
            .range(range)
            .latency(latency)
            .throughput(throughput)
            .errorRate(errorRate)
            .signatureDuration(signatureDuration)
            .challengeCompletion(challengeCompletion)
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
    
    /**
     * Compute signature duration metrics (time from creation to signedAt)
     */
    private SignatureDurationMetrics computeSignatureDurationMetrics(Instant from, Instant to, String range) {
        // Get all completed signatures in the range
        List<SignatureRequest> completedSignatures = signatureRequestRepository.findCompletedBetween(from, to);
        
        if (completedSignatures.isEmpty()) {
            log.info("No completed signatures found in range, returning empty duration metrics");
            return SignatureDurationMetrics.builder()
                .average(0.0)
                .median(0.0)
                .p95(0.0)
                .byChannel(new HashMap<>())
                .timeline(new ArrayList<>())
                .build();
        }
        
        // Calculate durations in seconds
        List<Double> durations = completedSignatures.stream()
            .filter(sr -> sr.getSignedAt() != null && sr.getCreatedAt() != null)
            .map(sr -> Duration.between(sr.getCreatedAt(), sr.getSignedAt()).toMillis() / 1000.0)
            .filter(d -> d >= 0) // Filter out negative durations (data issues)
            .sorted()
            .collect(Collectors.toList());
        
        if (durations.isEmpty()) {
            return SignatureDurationMetrics.builder()
                .average(0.0)
                .median(0.0)
                .p95(0.0)
                .byChannel(new HashMap<>())
                .timeline(new ArrayList<>())
                .build();
        }
        
        // Calculate overall metrics
        double average = durations.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double median = calculatePercentile(durations, 50);
        double p95 = calculatePercentile(durations, 95);
        
        // Calculate by channel (placeholder - would need channel info on SignatureRequest)
        Map<String, SignatureDurationMetrics.ChannelDuration> byChannel = new HashMap<>();
        // TODO: When SignatureRequest has channel field, group by channel and calculate
        
        // Calculate timeline
        List<SignatureDurationMetrics.DurationTimelinePoint> timeline = new ArrayList<>();
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            
            // Filter signatures completed on this day
            List<Double> dayDurations = completedSignatures.stream()
                .filter(sr -> sr.getSignedAt() != null && sr.getCreatedAt() != null)
                .filter(sr -> !sr.getSignedAt().isBefore(dayStart) && sr.getSignedAt().isBefore(dayEnd))
                .map(sr -> Duration.between(sr.getCreatedAt(), sr.getSignedAt()).toMillis() / 1000.0)
                .filter(d -> d >= 0)
                .sorted()
                .collect(Collectors.toList());
            
            double dayAverage = dayDurations.isEmpty() ? 0.0 : 
                dayDurations.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double dayMedian = dayDurations.isEmpty() ? 0.0 : calculatePercentile(dayDurations, 50);
            
            timeline.add(SignatureDurationMetrics.DurationTimelinePoint.builder()
                .date(currentDate.format(DATE_FORMATTER))
                .average(Math.round(dayAverage * 10.0) / 10.0)
                .median(Math.round(dayMedian * 10.0) / 10.0)
                .build());
        }
        
        log.info("Computed signature duration metrics: avg={}, median={}, p95={}, samples={}", 
            Math.round(average * 10.0) / 10.0, 
            Math.round(median * 10.0) / 10.0, 
            Math.round(p95 * 10.0) / 10.0, 
            durations.size());
        
        return SignatureDurationMetrics.builder()
            .average(Math.round(average * 10.0) / 10.0)
            .median(Math.round(median * 10.0) / 10.0)
            .p95(Math.round(p95 * 10.0) / 10.0)
            .byChannel(byChannel)
            .timeline(timeline)
            .build();
    }
    
    /**
     * Compute challenge completion metrics (time from sentAt to completedAt)
     */
    private ChallengeCompletionMetrics computeChallengeCompletionMetrics(Instant from, Instant to) {
        // Get all signature requests with sent challenges in the range
        List<SignatureRequest> requestsWithSentChallenges = signatureRequestRepository.findWithSentChallengesBetween(from, to);
        List<SignatureRequest> requestsWithCompletedChallenges = signatureRequestRepository.findWithCompletedChallengesBetween(from, to);
        
        // Extract all challenges
        List<com.bank.signature.domain.model.entity.SignatureChallenge> sentChallenges = requestsWithSentChallenges.stream()
            .flatMap(sr -> sr.getChallenges().stream())
            .filter(c -> c.getSentAt() != null && !c.getSentAt().isBefore(from) && c.getSentAt().isBefore(to))
            .collect(Collectors.toList());
        
        List<com.bank.signature.domain.model.entity.SignatureChallenge> completedChallenges = requestsWithCompletedChallenges.stream()
            .flatMap(sr -> sr.getChallenges().stream())
            .filter(c -> c.getCompletedAt() != null && !c.getCompletedAt().isBefore(from) && c.getCompletedAt().isBefore(to))
            .collect(Collectors.toList());
        
        long totalChallenges = sentChallenges.size();
        long completedCount = completedChallenges.size();
        
        if (totalChallenges == 0) {
            log.info("No sent challenges found in range, returning empty completion metrics");
            return ChallengeCompletionMetrics.builder()
                .averageResponseTime(0.0)
                .completionRate(0.0)
                .totalChallenges(0)
                .completedChallenges(0)
                .byChannel(new HashMap<>())
                .timeline(new ArrayList<>())
                .build();
        }
        
        // Calculate response times (sentAt to completedAt)
        List<Double> responseTimes = completedChallenges.stream()
            .filter(c -> c.getSentAt() != null && c.getCompletedAt() != null)
            .map(c -> Duration.between(c.getSentAt(), c.getCompletedAt()).toMillis() / 1000.0)
            .filter(d -> d >= 0)
            .collect(Collectors.toList());
        
        double averageResponseTime = responseTimes.isEmpty() ? 0.0 :
            responseTimes.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        double completionRate = (completedCount * 100.0) / totalChallenges;
        
        // Calculate by channel (placeholder - challenges have channelType)
        Map<String, ChallengeCompletionMetrics.ChannelChallengeMetrics> byChannel = new HashMap<>();
        // Group by channel type
        Map<String, List<com.bank.signature.domain.model.entity.SignatureChallenge>> sentByChannel = sentChallenges.stream()
            .filter(c -> c.getChannelType() != null)
            .collect(Collectors.groupingBy(c -> c.getChannelType().name()));
        
        Map<String, List<com.bank.signature.domain.model.entity.SignatureChallenge>> completedByChannel = completedChallenges.stream()
            .filter(c -> c.getChannelType() != null)
            .collect(Collectors.groupingBy(c -> c.getChannelType().name()));
        
        for (String channelName : sentByChannel.keySet()) {
            List<com.bank.signature.domain.model.entity.SignatureChallenge> channelSent = sentByChannel.get(channelName);
            List<com.bank.signature.domain.model.entity.SignatureChallenge> channelCompleted = completedByChannel.getOrDefault(channelName, new ArrayList<>());
            
            double channelAvgTime = channelCompleted.stream()
                .filter(c -> c.getSentAt() != null && c.getCompletedAt() != null)
                .mapToDouble(c -> Duration.between(c.getSentAt(), c.getCompletedAt()).toMillis() / 1000.0)
                .average()
                .orElse(0.0);
            
            double channelCompletionRate = channelSent.isEmpty() ? 0.0 : 
                (channelCompleted.size() * 100.0) / channelSent.size();
            
            byChannel.put(channelName, ChallengeCompletionMetrics.ChannelChallengeMetrics.builder()
                .averageResponseTime(Math.round(channelAvgTime * 10.0) / 10.0)
                .completionRate(Math.round(channelCompletionRate * 10.0) / 10.0)
                .totalChallenges(channelSent.size())
                .build());
        }
        
        // Calculate timeline
        List<ChallengeCompletionMetrics.ChallengeTimelinePoint> timeline = new ArrayList<>();
        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = LocalDate.ofInstant(to, ZoneOffset.UTC);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            
            // Filter challenges for this day
            List<com.bank.signature.domain.model.entity.SignatureChallenge> daySent = sentChallenges.stream()
                .filter(c -> c.getSentAt() != null && !c.getSentAt().isBefore(dayStart) && c.getSentAt().isBefore(dayEnd))
                .collect(Collectors.toList());
            
            List<com.bank.signature.domain.model.entity.SignatureChallenge> dayCompleted = completedChallenges.stream()
                .filter(c -> c.getCompletedAt() != null && !c.getCompletedAt().isBefore(dayStart) && c.getCompletedAt().isBefore(dayEnd))
                .collect(Collectors.toList());
            
            double dayAvgTime = dayCompleted.stream()
                .filter(c -> c.getSentAt() != null && c.getCompletedAt() != null)
                .mapToDouble(c -> Duration.between(c.getSentAt(), c.getCompletedAt()).toMillis() / 1000.0)
                .average()
                .orElse(0.0);
            
            double dayCompletionRate = daySent.isEmpty() ? 0.0 : 
                (dayCompleted.size() * 100.0) / daySent.size();
            
            timeline.add(ChallengeCompletionMetrics.ChallengeTimelinePoint.builder()
                .date(currentDate.format(DATE_FORMATTER))
                .avgResponseTime(Math.round(dayAvgTime * 10.0) / 10.0)
                .completionRate(Math.round(dayCompletionRate * 10.0) / 10.0)
                .build());
        }
        
        log.info("Computed challenge completion metrics: avgTime={}, rate={}%, total={}, completed={}", 
            Math.round(averageResponseTime * 10.0) / 10.0, 
            Math.round(completionRate * 10.0) / 10.0, 
            totalChallenges,
            completedCount);
        
        return ChallengeCompletionMetrics.builder()
            .averageResponseTime(Math.round(averageResponseTime * 10.0) / 10.0)
            .completionRate(Math.round(completionRate * 10.0) / 10.0)
            .totalChallenges(totalChallenges)
            .completedChallenges(completedCount)
            .byChannel(byChannel)
            .timeline(timeline)
            .build();
    }
    
    /**
     * Calculate percentile from sorted list of values
     */
    private double calculatePercentile(List<Double> sortedValues, int percentile) {
        if (sortedValues.isEmpty()) {
            return 0.0;
        }
        if (sortedValues.size() == 1) {
            return sortedValues.get(0);
        }
        
        double index = (percentile / 100.0) * (sortedValues.size() - 1);
        int lower = (int) Math.floor(index);
        int upper = (int) Math.ceil(index);
        
        if (lower == upper) {
            return sortedValues.get(lower);
        }
        
        double fraction = index - lower;
        return sortedValues.get(lower) + fraction * (sortedValues.get(upper) - sortedValues.get(lower));
    }
}


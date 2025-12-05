package com.bank.signature.application.usecase;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.bank.signature.application.dto.response.DashboardMetricsResponse;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.ChannelMetrics;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.ErrorTimelinePoint;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.HourlyDataPoint;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.LatencyTimelinePoint;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.OverviewMetrics;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.ProviderHealthStatus;
import com.bank.signature.application.dto.response.DashboardMetricsResponse.RecentActivityItem;
import com.bank.signature.application.dto.response.ProviderHealthResponse;
import com.bank.signature.application.service.ProviderHealthService;
import com.bank.signature.domain.model.valueobject.Channel;
import com.bank.signature.domain.model.valueobject.HealthStatus;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of Get Dashboard Metrics Use Case
 * Story 12.1: Dashboard Metrics Endpoint
 * Epic 14: Frontend-Backend Complete Integration
 * 
 * Aggregates metrics from SignatureRequestRepository, ProviderHealthService,
 * RoutingRuleRepository, and CircuitBreakerRegistry.
 * Results are cached for 1 minute to avoid expensive queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetDashboardMetricsUseCaseImpl implements GetDashboardMetricsUseCase {

        private final SignatureRequestRepository signatureRequestRepository;
        private final ProviderHealthService providerHealthService;
        private final RoutingRuleRepository routingRuleRepository;
        private final CircuitBreakerRegistry circuitBreakerRegistry;

        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
        private static final DateTimeFormatter HOUR_FORMATTER = DateTimeFormatter.ofPattern("HH:00");

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

                // Overview metrics (now includes activeSignatures, routingRulesCount,
                // circuitBreakersOpen, failedSignatures24h)
                OverviewMetrics overview = computeOverviewMetrics(last24h, last7d, last30d, now);

                // Channel metrics
                Map<String, ChannelMetrics> byChannel = computeChannelMetrics(last30d, now);

                // Latency timeline (last 7 days)
                List<LatencyTimelinePoint> latencyTimeline = computeLatencyTimeline(last7d, now);

                // Error timeline (last 7 days)
                List<ErrorTimelinePoint> errorTimeline = computeErrorTimeline(last7d, now);

                // Provider health status
                List<ProviderHealthStatus> providerHealth = computeProviderHealth();

                // Recent activity (last 10 events)
                List<RecentActivityItem> recentActivity = computeRecentActivity(now);

                // Hourly traffic data (last 24 hours)
                List<HourlyDataPoint> hourlyData = computeHourlyData(last24h, now);

                log.info(
                                "Dashboard metrics computed: total24h={}, successRate={}, activeProviders={}/{}, activeSignatures={}, rules={}, cbOpen={}",
                                overview.totalSignatures24h(),
                                overview.successRate(),
                                overview.activeProviders(),
                                overview.totalProviders(),
                                overview.activeSignatures(),
                                overview.routingRulesCount(),
                                overview.circuitBreakersOpen());

                return DashboardMetricsResponse.builder()
                                .overview(overview)
                                .byChannel(byChannel)
                                .latencyTimeline(latencyTimeline)
                                .errorTimeline(errorTimeline)
                                .providerHealth(providerHealth)
                                .recentActivity(recentActivity)
                                .hourlyData(hourlyData)
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
                                SignatureStatus.SIGNED, last30d, now);
                double successRate = total30d > 0 ? (successfulCount * 100.0 / total30d) : 0.0;

                // Failed signatures in last 24h
                long failedCount24h = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.FAILED, last24h, now);
                long expiredCount24h = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.EXPIRED, last24h, now);
                long failedSignatures24h = failedCount24h + expiredCount24h;

                // Active signatures (PENDING or CHALLENGED status)
                long activePending = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.PENDING, last7d, now);
                long activeChallenged = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.CHALLENGED, last7d, now);
                long activeSignatures = activePending + activeChallenged;

                // Average latency (last 30 days)
                // TODO: Implement latency calculation from metrics or event sourcing
                // For now, using a placeholder
                long avgLatency = 245L; // Placeholder

                // Provider health
                var healthResponse = providerHealthService.getProvidersHealth(false);
                int totalProviders = healthResponse.providers().size();
                int activeProviders = (int) healthResponse.providers().stream()
                                .filter(p -> HealthStatus.Status.UP.equals(p.status()))
                                .count();

                // Routing rules count
                int routingRulesCount = routingRuleRepository.findAllActiveOrderedByPriority().size();

                // Circuit breakers open count
                int circuitBreakersOpen = (int) circuitBreakerRegistry.getAllCircuitBreakers().stream()
                                .filter(cb -> cb.getState() == CircuitBreaker.State.OPEN ||
                                                cb.getState() == CircuitBreaker.State.FORCED_OPEN)
                                .count();

                return OverviewMetrics.builder()
                                .totalSignatures24h(total24h)
                                .totalSignatures7d(total7d)
                                .totalSignatures30d(total30d)
                                .successRate(Math.round(successRate * 10.0) / 10.0) // Round to 1 decimal
                                .avgLatency(avgLatency)
                                .activeProviders(activeProviders)
                                .totalProviders(totalProviders)
                                .activeSignatures(activeSignatures)
                                .routingRulesCount(routingRulesCount)
                                .circuitBreakersOpen(circuitBreakersOpen)
                                .failedSignatures24h(failedSignatures24h)
                                .build();
        }

        /**
         * Compute metrics by channel using challenges data.
         * Since SignatureRequest doesn't have a channel field, we derive this from
         * challenges.
         */
        private Map<String, ChannelMetrics> computeChannelMetrics(Instant from, Instant to) {
                Map<String, ChannelMetrics> metrics = new HashMap<>();

                // Get channel success rates from challenges
                Map<String, SignatureRequestRepository.ChannelStats> channelStats = signatureRequestRepository
                                .getChannelSuccessRates(from, to);

                for (Map.Entry<String, SignatureRequestRepository.ChannelStats> entry : channelStats.entrySet()) {
                        String channelName = entry.getKey();
                        SignatureRequestRepository.ChannelStats stats = entry.getValue();

                        long totalCount = stats.totalCount();
                        long successCount = stats.successCount();

                        if (totalCount > 0) {
                                double successRate = (successCount * 100.0 / totalCount);

                                // Get placeholder latency for channel (will be replaced with real metrics
                                // later)
                                Channel channel = parseChannel(channelName);
                                long avgLatency = channel != null ? getPlaceholderLatency(channel) : 200L;

                                metrics.put(channelName, ChannelMetrics.builder()
                                                .count(totalCount)
                                                .successRate(Math.round(successRate * 10.0) / 10.0)
                                                .avgLatency(avgLatency)
                                                .build());
                        }
                }

                return metrics;
        }

        /**
         * Parse channel name to Channel enum, returning null if not found.
         */
        private Channel parseChannel(String channelName) {
                try {
                        return Channel.valueOf(channelName);
                } catch (IllegalArgumentException e) {
                        log.warn("Unknown channel name: {}", channelName);
                        return null;
                }
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
                                        .p50(145 + (long) (Math.random() * 10))
                                        .p95(410 + (long) (Math.random() * 30))
                                        .p99(740 + (long) (Math.random() * 60))
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
                                                SignatureStatus.FAILED, dayStart, dayEnd);

                                long expiredCount = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                                SignatureStatus.EXPIRED, dayStart, dayEnd);

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

        /**
         * Compute provider health status for dashboard
         */
        private List<ProviderHealthStatus> computeProviderHealth() {
                var healthResponse = providerHealthService.getProvidersHealth(false);
                List<ProviderHealthStatus> result = new ArrayList<>();

                for (ProviderHealthResponse provider : healthResponse.providers()) {
                        // Get circuit breaker state
                        String circuitBreakerName = provider.name();
                        String circuitState = "CLOSED";

                        var circuitBreaker = circuitBreakerRegistry.find(circuitBreakerName);
                        if (circuitBreaker.isPresent()) {
                                circuitState = circuitBreaker.get().getState().name();
                        }

                        // Map status to dashboard format
                        String status = switch (provider.status()) {
                                case HealthStatus.Status.UP -> "healthy";
                                case HealthStatus.Status.DOWN -> "down";
                                default -> "degraded";
                        };

                        // Uptime placeholder (would come from metrics in production)
                        double uptime = status.equals("healthy") ? 99.9 : status.equals("degraded") ? 95.0 : 0.0;

                        // Get provider type as string
                        String providerType = provider.type().name();

                        // Display name mapping
                        String displayName = getProviderDisplayName(providerType);

                        result.add(ProviderHealthStatus.builder()
                                        .name(displayName)
                                        .type(providerType)
                                        .status(status)
                                        .uptime(uptime)
                                        .circuitState(circuitState)
                                        .build());
                }

                return result;
        }

        /**
         * Get human-readable provider display name
         */
        private String getProviderDisplayName(String type) {
                return switch (type.toUpperCase()) {
                        case "SMS" -> "Twilio SMS";
                        case "PUSH" -> "OneSignal Push";
                        case "VOICE" -> "Vonage Voice";
                        case "BIOMETRIC" -> "BioCatch";
                        default -> type;
                };
        }

        /**
         * Compute recent activity feed
         * 
         * In production, this would query an event store or audit log.
         * For now, generates sample activity based on recent signature statuses.
         */
        private List<RecentActivityItem> computeRecentActivity(Instant now) {
                List<RecentActivityItem> activity = new ArrayList<>();

                // Get recent signatures by status for activity feed
                Instant last1h = now.minusSeconds(60 * 60);

                long recentValidated = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.VALIDATED, last1h, now);
                long recentFailed = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.FAILED, last1h, now);
                long recentPending = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                SignatureStatus.PENDING, last1h, now);

                // Generate activity items based on recent data
                int activityId = 1;

                if (recentValidated > 0) {
                        activity.add(RecentActivityItem.builder()
                                        .id(String.valueOf(activityId++))
                                        .type("success")
                                        .message(String.format("%d firmas completadas exitosamente", recentValidated))
                                        .timestamp(now.minusSeconds(120))
                                        .relativeTime("Hace 2 min")
                                        .build());
                }

                if (recentFailed > 0) {
                        activity.add(RecentActivityItem.builder()
                                        .id(String.valueOf(activityId++))
                                        .type("error")
                                        .message(String.format("%d firmas fallidas en la última hora", recentFailed))
                                        .timestamp(now.minusSeconds(300))
                                        .relativeTime("Hace 5 min")
                                        .build());
                }

                if (recentPending > 0) {
                        activity.add(RecentActivityItem.builder()
                                        .id(String.valueOf(activityId++))
                                        .type("info")
                                        .message(String.format("%d firmas pendientes de validación", recentPending))
                                        .timestamp(now.minusSeconds(480))
                                        .relativeTime("Hace 8 min")
                                        .build());
                }

                // Check circuit breakers for warnings
                long openCircuitBreakers = circuitBreakerRegistry.getAllCircuitBreakers().stream()
                                .filter(cb -> cb.getState() == CircuitBreaker.State.OPEN)
                                .count();

                if (openCircuitBreakers > 0) {
                        activity.add(RecentActivityItem.builder()
                                        .id(String.valueOf(activityId++))
                                        .type("warning")
                                        .message(String.format("%d proveedores en modo degradado", openCircuitBreakers))
                                        .timestamp(now.minusSeconds(600))
                                        .relativeTime("Hace 10 min")
                                        .build());
                }

                // Add routing rules info
                int activeRules = routingRuleRepository.findAllActiveOrderedByPriority().size();
                activity.add(RecentActivityItem.builder()
                                .id(String.valueOf(activityId++))
                                .type("info")
                                .message(String.format("%d reglas de routing activas", activeRules))
                                .timestamp(now.minusSeconds(900))
                                .relativeTime("Hace 15 min")
                                .build());

                // Sort by timestamp (most recent first) and limit to 10
                return activity.stream()
                                .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
                                .limit(10)
                                .collect(Collectors.toList());
        }

        /**
         * Compute hourly traffic data for last 24 hours
         */
        private List<HourlyDataPoint> computeHourlyData(Instant last24h, Instant now) {
                List<HourlyDataPoint> hourlyData = new ArrayList<>();

                // Get start of current hour
                ZonedDateTime nowZdt = now.atZone(ZoneOffset.UTC);
                ZonedDateTime startOfCurrentHour = nowZdt.truncatedTo(ChronoUnit.HOURS);

                // Go back 24 hours, computing data for each hour
                for (int i = 23; i >= 0; i--) {
                        ZonedDateTime hourStart = startOfCurrentHour.minusHours(i);
                        ZonedDateTime hourEnd = hourStart.plusHours(1);

                        Instant from = hourStart.toInstant();
                        Instant to = hourEnd.toInstant();

                        long total = signatureRequestRepository.countByCreatedAtBetween(from, to);
                        long successful = signatureRequestRepository.countByStatusAndCreatedAtBetween(
                                        SignatureStatus.VALIDATED, from, to);

                        hourlyData.add(HourlyDataPoint.builder()
                                        .hour(hourStart.format(HOUR_FORMATTER))
                                        .total(total)
                                        .successful(successful)
                                        .build());
                }

                return hourlyData;
        }
}

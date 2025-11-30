import { EventEmitter } from 'events';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, unknown>;
  resourceUsage?: {
    memoryUsed?: number;
    cpuUsage?: number;
  };
}

export interface OperationStats {
  count: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
  errorRate: number;
  throughput: number; // operations per second
  lastExecuted?: number;
}

export interface AlertRule {
  id: string;
  operation: string;
  metric: 'duration' | 'successRate' | 'errorRate' | 'throughput';
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq';
  timeWindow: number; // in milliseconds
  cooldown: number; // minimum time between alerts
  enabled: boolean;
}

export interface Alert {
  id: string;
  rule: AlertRule;
  triggeredAt: number;
  value: number;
  threshold: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor | null = null;
  private metrics = new Map<string, PerformanceMetric[]>();
  private alerts = new Map<string, Alert[]>();
  private alertRules: AlertRule[] = [];
  private lastAlertTime = new Map<string, number>();
  
  // Configuration
  private readonly MAX_METRICS_PER_OPERATION = 1000;
  private readonly METRICS_RETENTION_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    super();
    this.startPeriodicCleanup();
    this.initializeDefaultAlerts();
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Track performance of an operation
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    const startTimestamp = Date.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.recordMetric({
        operation,
        duration,
        success: true,
        timestamp: startTimestamp,
        metadata,
        resourceUsage: {
          memoryUsed: endMemory - startMemory
        }
      });

      return result;
    } catch (error: unknown) {
      const duration = performance.now() - startTime;

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof Error ? error.name : 'Unknown';

      this.recordMetric({
        operation,
        duration,
        success: false,
        timestamp: startTimestamp,
        metadata: {
          ...metadata,
          error: errorMessage,
          errorType: errorType
        }
      });

      throw error;
    }
  }

  /**
   * Record a metric manually
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, []);
    }

    const operationMetrics = this.metrics.get(metric.operation)!;
    operationMetrics.push(metric);

    // Keep only recent metrics
    if (operationMetrics.length > this.MAX_METRICS_PER_OPERATION) {
      operationMetrics.splice(0, operationMetrics.length - this.MAX_METRICS_PER_OPERATION);
    }

    // Check alert rules
    this.checkAlerts(metric.operation);

    // Emit event
    this.emit('metric', metric);
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string, timeWindow?: number): OperationStats | null {
    const metrics = this.getMetricsInWindow(operation, timeWindow);
    
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = metrics.filter(m => m.success).length;
    const timeSpan = Math.max(1, metrics[metrics.length - 1].timestamp - metrics[0].timestamp);
    const throughput = (metrics.length / timeSpan) * 1000; // per second

    return {
      count: metrics.length,
      successCount,
      failureCount: metrics.length - successCount,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
      successRate: successCount / metrics.length,
      errorRate: (metrics.length - successCount) / metrics.length,
      throughput,
      lastExecuted: metrics[metrics.length - 1]?.timestamp
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(timeWindow?: number): Record<string, OperationStats> {
    const stats: Record<string, OperationStats> = {};
    
    for (const operation of this.metrics.keys()) {
      const operationStats = this.getStats(operation, timeWindow);
      if (operationStats) {
        stats[operation] = operationStats;
      }
    }

    return stats;
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    this.emit('alertRuleAdded', rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      const rule = this.alertRules.splice(index, 1)[0];
      this.emit('alertRuleRemoved', rule);
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Get alerts for an operation
   */
  getAlerts(operation?: string): Alert[] {
    if (operation) {
      return this.alerts.get(operation) || [];
    }

    const allAlerts: Alert[] = [];
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts);
    }
    
    return allAlerts.sort((a, b) => b.triggeredAt - a.triggeredAt);
  }

  /**
   * Clear alerts for an operation
   */
  clearAlerts(operation?: string): void {
    if (operation) {
      this.alerts.delete(operation);
    } else {
      this.alerts.clear();
    }
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindow: number = 60 * 60 * 1000): {
    totalOperations: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestOperations: Array<{ operation: string; averageDuration: number }>;
    alerts: Alert[];
  } {
    const allStats = this.getAllStats(timeWindow);
    const operationNames = Object.keys(allStats);
    
    const totalRequests = Object.values(allStats).reduce((sum, stats) => sum + stats.count, 0);
    const totalDuration = Object.values(allStats).reduce((sum, stats) => sum + (stats.averageDuration * stats.count), 0);
    const totalErrors = Object.values(allStats).reduce((sum, stats) => sum + stats.failureCount, 0);

    const slowestOperations = operationNames
      .map(op => ({ operation: op, averageDuration: allStats[op].averageDuration }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    const recentAlerts = this.getAlerts().filter(alert => 
      Date.now() - alert.triggeredAt < timeWindow
    );

    return {
      totalOperations: operationNames.length,
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalDuration / totalRequests : 0,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      slowestOperations,
      alerts: recentAlerts
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'prometheus' | 'json' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusMetrics();
    }

    const allStats = this.getAllStats();
    const summary = this.getSummary();
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      operations: allStats,
      alerts: this.getAlerts()
    }, null, 2);
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    criticalAlerts: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const summary = this.getSummary();
    const criticalAlerts = summary.alerts.filter(a => a.severity === 'critical').length;
    const issues: string[] = [];

    if (summary.averageResponseTime > 5000) {
      issues.push('High average response time');
    }

    if (summary.errorRate > 0.05) { // 5% error rate
      issues.push('High error rate');
    }

    if (criticalAlerts > 0) {
      issues.push(`${criticalAlerts} critical alerts`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      criticalAlerts,
      averageResponseTime: summary.averageResponseTime,
      errorRate: summary.errorRate
    };
  }

  /**
   * Start performance tracking for an operation
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        success: true,
        timestamp: startTimestamp
      });
    };
  }

  /**
   * Private methods
   */
  private getMetricsInWindow(operation: string, timeWindow?: number): PerformanceMetric[] {
    const metrics = this.metrics.get(operation) || [];
    
    if (!timeWindow) {
      return metrics;
    }

    const cutoff = Date.now() - timeWindow;
    return metrics.filter(m => m.timestamp > cutoff);
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private checkAlerts(operation: string): void {
    const operationRules = this.alertRules.filter(rule => 
      rule.enabled && (rule.operation === operation || rule.operation === '*')
    );

    for (const rule of operationRules) {
      this.evaluateAlertRule(rule, operation);
    }
  }

  private evaluateAlertRule(rule: AlertRule, operation: string): void {
    const stats = this.getStats(operation, rule.timeWindow);
    if (!stats) return;

    const lastAlert = this.lastAlertTime.get(rule.id) || 0;
    const now = Date.now();
    
    if (now - lastAlert < rule.cooldown) {
      return; // Still in cooldown
    }

    let value: number;
    let shouldAlert = false;

    switch (rule.metric) {
      case 'duration':
        value = stats.averageDuration;
        break;
      case 'successRate':
        value = stats.successRate;
        break;
      case 'errorRate':
        value = stats.errorRate;
        break;
      case 'throughput':
        value = stats.throughput;
        break;
    }

    switch (rule.comparison) {
      case 'gt':
        shouldAlert = value > rule.threshold;
        break;
      case 'lt':
        shouldAlert = value < rule.threshold;
        break;
      case 'eq':
        shouldAlert = Math.abs(value - rule.threshold) < 0.001;
        break;
    }

    if (shouldAlert) {
      this.triggerAlert(rule, operation, value);
    }
  }

  private triggerAlert(rule: AlertRule, operation: string, value: number): void {
    const severity = this.determineAlertSeverity(rule, value);
    
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      rule,
      triggeredAt: Date.now(),
      value,
      threshold: rule.threshold,
      message: this.generateAlertMessage(rule, operation, value),
      severity
    };

    if (!this.alerts.has(operation)) {
      this.alerts.set(operation, []);
    }

    this.alerts.get(operation)!.push(alert);
    this.lastAlertTime.set(rule.id, Date.now());

    this.emit('alert', alert);
    console.warn('Performance Alert:', alert);
  }

  private determineAlertSeverity(rule: AlertRule, value: number): Alert['severity'] {
    const deviation = Math.abs(value - rule.threshold) / rule.threshold;
    
    if (deviation > 1) return 'critical';
    if (deviation > 0.5) return 'high';
    if (deviation > 0.2) return 'medium';
    return 'low';
  }

  private generateAlertMessage(rule: AlertRule, operation: string, value: number): string {
    return `Operation "${operation}" ${rule.metric} (${value.toFixed(2)}) ${rule.comparison} threshold (${rule.threshold})`;
  }

  private getMemoryUsage(): number {
    try {
      return process.memoryUsage().heapUsed;
    } catch {
      return 0;
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.METRICS_RETENTION_PERIOD;
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(operation);
      } else {
        this.metrics.set(operation, filteredMetrics);
      }
    }

    // Cleanup old alerts
    for (const [operation, alerts] of this.alerts.entries()) {
      const recentAlerts = alerts.filter(a => Date.now() - a.triggeredAt < this.METRICS_RETENTION_PERIOD);
      
      if (recentAlerts.length === 0) {
        this.alerts.delete(operation);
      } else {
        this.alerts.set(operation, recentAlerts);
      }
    }
  }

  private initializeDefaultAlerts(): void {
    // Default alert rules
    const defaultRules: AlertRule[] = [
      {
        id: 'high_response_time',
        operation: '*',
        metric: 'duration',
        threshold: 5000, // 5 seconds
        comparison: 'gt',
        timeWindow: 5 * 60 * 1000, // 5 minutes
        cooldown: this.DEFAULT_ALERT_COOLDOWN,
        enabled: true
      },
      {
        id: 'high_error_rate',
        operation: '*',
        metric: 'errorRate',
        threshold: 0.1, // 10%
        comparison: 'gt',
        timeWindow: 5 * 60 * 1000,
        cooldown: this.DEFAULT_ALERT_COOLDOWN,
        enabled: true
      },
      {
        id: 'low_success_rate',
        operation: '*',
        metric: 'successRate',
        threshold: 0.9, // 90%
        comparison: 'lt',
        timeWindow: 5 * 60 * 1000,
        cooldown: this.DEFAULT_ALERT_COOLDOWN,
        enabled: true
      }
    ];

    this.alertRules.push(...defaultRules);
  }

  private exportPrometheusMetrics(): string {
    const lines: string[] = [];
    const allStats = this.getAllStats();

    for (const [operation, stats] of Object.entries(allStats)) {
      const sanitizedOp = operation.replace(/[^a-zA-Z0-9_]/g, '_');
      
      lines.push(`# HELP ${sanitizedOp}_duration_seconds Operation duration`);
      lines.push(`# TYPE ${sanitizedOp}_duration_seconds histogram`);
      lines.push(`${sanitizedOp}_duration_seconds_sum ${(stats.averageDuration * stats.count) / 1000}`);
      lines.push(`${sanitizedOp}_duration_seconds_count ${stats.count}`);
      
      lines.push(`# HELP ${sanitizedOp}_success_rate Success rate of operations`);
      lines.push(`# TYPE ${sanitizedOp}_success_rate gauge`);
      lines.push(`${sanitizedOp}_success_rate ${stats.successRate}`);
      
      lines.push(`# HELP ${sanitizedOp}_throughput Operations per second`);
      lines.push(`# TYPE ${sanitizedOp}_throughput gauge`);
      lines.push(`${sanitizedOp}_throughput ${stats.throughput}`);
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.track(operation, fn, metadata);
}

export function startTiming(operation: string): () => void {
  return performanceMonitor.startTiming(operation);
}

export function recordMetric(metric: PerformanceMetric): void {
  performanceMonitor.recordMetric(metric);
}
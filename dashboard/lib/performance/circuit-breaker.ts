import { EventEmitter } from 'events';
import { cacheService } from './cache-service';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
  expectedErrors?: string[];
  slowCallDurationThreshold?: number;
  slowCallRateThreshold?: number;
  volumeThreshold?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime?: number;
  lastStateChange: number;
  failureRate: number;
  averageResponseTime: number;
  slowCallRate: number;
}

export interface CallResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  duration: number;
  timestamp: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange = Date.now();
  private callHistory: Array<{ success: boolean; duration: number; timestamp: number }> = [];
  private slowCallCount = 0;

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    super();
    
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      recoveryTimeout: options.recoveryTimeout ?? 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod ?? 300000, // 5 minutes
      expectedErrors: options.expectedErrors ?? [],
      slowCallDurationThreshold: options.slowCallDurationThreshold ?? 5000, // 5 seconds
      slowCallRateThreshold: options.slowCallRateThreshold ?? 0.5, // 50%
      volumeThreshold: options.volumeThreshold ?? 10
    };

    this.startPeriodicCleanup();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;
    
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.emit('stateChange', { from: CircuitState.OPEN, to: CircuitState.HALF_OPEN });
        console.log(`Circuit breaker ${this.name}: OPEN -> HALF_OPEN`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        error.name = 'CircuitBreakerOpenError';
        throw error;
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.onSuccess(duration);
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      this.onFailure(error as Error, duration);
      throw error;
    }
  }

  /**
   * Execute with fallback function
   */
  async executeWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(primaryFn);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'CircuitBreakerOpenError') {
        console.log(`Circuit breaker ${this.name} is open, using fallback`);
        return await fallbackFn();
      }
      throw error;
    }
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanOldCalls();
    
    const recentCalls = this.callHistory.length;
    const slowCalls = this.callHistory.filter(call => 
      call.duration > this.options.slowCallDurationThreshold
    ).length;

    const failureRate = recentCalls > 0 
      ? (recentCalls - this.callHistory.filter(c => c.success).length) / recentCalls
      : 0;

    const averageResponseTime = recentCalls > 0
      ? this.callHistory.reduce((sum, call) => sum + call.duration, 0) / recentCalls
      : 0;

    const slowCallRate = recentCalls > 0 ? slowCalls / recentCalls : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime || undefined,
      lastStateChange: this.lastStateChange,
      failureRate,
      averageResponseTime,
      slowCallRate
    };
  }

  /**
   * Force reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.callHistory = [];
    this.slowCallCount = 0;
    
    this.emit('reset', { name: this.name });
    console.log(`Circuit breaker ${this.name} manually reset`);
  }

  /**
   * Force open circuit breaker
   */
  forceOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.lastStateChange = Date.now();
    
    this.emit('stateChange', { from: previousState, to: CircuitState.OPEN });
    console.log(`Circuit breaker ${this.name} forced open`);
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Get cache key for persistence
   */
  private getCacheKey(): string {
    return `circuit-breaker:${this.name}`;
  }

  /**
   * Save state to cache for persistence
   */
  private async saveState(): Promise<void> {
    try {
      const state = {
        state: this.state,
        failureCount: this.failureCount,
        successCount: this.successCount,
        totalCalls: this.totalCalls,
        lastFailureTime: this.lastFailureTime,
        lastStateChange: this.lastStateChange,
        callHistory: this.callHistory.slice(-100) // Keep last 100 calls
      };

      await cacheService.set(this.getCacheKey(), state, 3600); // 1 hour TTL
    } catch (error) {
      console.warn(`Failed to save circuit breaker state for ${this.name}:`, error);
    }
  }

  /**
   * Load state from cache
   */
  private async loadState(): Promise<void> {
    try {
      const savedState = await cacheService.get<Partial<CircuitBreakerStats & { callHistory: Array<{ success: boolean; duration: number; timestamp: number }> }>>(this.getCacheKey());
      if (savedState) {
        this.state = savedState.state || CircuitState.CLOSED;
        this.failureCount = savedState.failureCount || 0;
        this.successCount = savedState.successCount || 0;
        this.totalCalls = savedState.totalCalls || 0;
        this.lastFailureTime = savedState.lastFailureTime ?? null;
        this.lastStateChange = savedState.lastStateChange || Date.now();
        this.callHistory = savedState.callHistory || [];
      }
    } catch (error) {
      console.warn(`Failed to load circuit breaker state for ${this.name}:`, error);
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(duration: number): void {
    this.successCount++;
    this.recordCall(true, duration);

    if (this.state === CircuitState.HALF_OPEN) {
      // Reset to closed after successful call in half-open state
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.lastStateChange = Date.now();
      
      this.emit('stateChange', { from: CircuitState.HALF_OPEN, to: CircuitState.CLOSED });
      console.log(`Circuit breaker ${this.name}: HALF_OPEN -> CLOSED`);
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on successful call
      this.failureCount = 0;
    }

    this.saveState();
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error, duration: number): void {
    // Don't count expected errors as failures
    if (this.isExpectedError(error)) {
      this.recordCall(true, duration); // Count as success for circuit breaker purposes
      return;
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.recordCall(false, duration);

    // Check if should trip to open
    if (this.shouldTrip()) {
      const previousState = this.state;
      this.state = CircuitState.OPEN;
      this.lastStateChange = Date.now();
      
      this.emit('stateChange', { from: previousState, to: CircuitState.OPEN });
      this.emit('circuitOpened', { 
        name: this.name, 
        failureCount: this.failureCount,
        error: error.message 
      });
      
      console.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
    }

    this.saveState();
  }

  /**
   * Record call in history
   */
  private recordCall(success: boolean, duration: number): void {
    this.callHistory.push({
      success,
      duration,
      timestamp: Date.now()
    });

    // Keep only recent calls
    this.cleanOldCalls();

    if (duration > this.options.slowCallDurationThreshold) {
      this.slowCallCount++;
    }
  }

  /**
   * Clean old call records
   */
  private cleanOldCalls(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.callHistory = this.callHistory.filter(call => call.timestamp > cutoff);
  }

  /**
   * Check if error is expected and should not trip the circuit
   */
  private isExpectedError(error: Error): boolean {
    return this.options.expectedErrors.some(expectedError => 
      error.message.includes(expectedError) || error.name === expectedError
    );
  }

  /**
   * Check if circuit should trip to open
   */
  private shouldTrip(): boolean {
    if (this.state === CircuitState.OPEN) {
      return false; // Already open
    }

    // Check failure threshold
    if (this.failureCount >= this.options.failureThreshold) {
      return true;
    }

    // Check if we have enough volume to make a decision
    if (this.callHistory.length < this.options.volumeThreshold) {
      return false;
    }

    // Check failure rate
    const recentFailures = this.callHistory.filter(call => !call.success).length;
    const failureRate = recentFailures / this.callHistory.length;
    
    if (failureRate >= 0.5) { // 50% failure rate
      return true;
    }

    // Check slow call rate
    const slowCalls = this.callHistory.filter(call => 
      call.duration > this.options.slowCallDurationThreshold
    ).length;
    const slowCallRate = slowCalls / this.callHistory.length;
    
    return slowCallRate >= this.options.slowCallRateThreshold;
  }

  /**
   * Check if should attempt reset from open to half-open
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastStateChange > this.options.recoveryTimeout;
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanOldCalls();
    }, 60000); // Clean every minute
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager | null = null;
  private breakers = new Map<string, CircuitBreaker>();

  private constructor() {
    this.startHealthCheck();
  }

  static getInstance(): CircuitBreakerManager {
    if (!this.instance) {
      this.instance = new CircuitBreakerManager();
    }
    return this.instance;
  }

  /**
   * Get or create circuit breaker for a service
   */
  getCircuitBreaker(
    name: string, 
    options?: CircuitBreakerOptions
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, options);
      
      // Set up event listeners
      breaker.on('stateChange', (event) => {
        console.log(`Circuit breaker ${name} state changed: ${event.from} -> ${event.to}`);
      });

      breaker.on('circuitOpened', (event) => {
        console.warn(`Circuit breaker ${name} opened:`, event);
      });

      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, boolean> {
    const health: Record<string, boolean> = {};
    
    for (const [name, breaker] of this.breakers) {
      health[name] = breaker.isHealthy();
    }

    return health;
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    setInterval(() => {
      const unhealthyServices = [];
      
      for (const [name, breaker] of this.breakers) {
        if (!breaker.isHealthy()) {
          unhealthyServices.push(name);
        }
      }

      if (unhealthyServices.length > 0) {
        console.warn('Unhealthy services detected:', unhealthyServices);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();

// Predefined circuit breakers for email providers
export const emailProviderBreakers = {
  nodemailer: () => circuitBreakerManager.getCircuitBreaker('email-nodemailer', {
    failureThreshold: 3,
    recoveryTimeout: 60000,
    slowCallDurationThreshold: 10000
  }),
  
  resend: () => circuitBreakerManager.getCircuitBreaker('email-resend', {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    expectedErrors: ['RateLimitError']
  }),
  
  sendgrid: () => circuitBreakerManager.getCircuitBreaker('email-sendgrid', {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    expectedErrors: ['RateLimitError', 'QuotaExceededError']
  }),
  
  postmark: () => circuitBreakerManager.getCircuitBreaker('email-postmark', {
    failureThreshold: 3,
    recoveryTimeout: 45000
  })
};
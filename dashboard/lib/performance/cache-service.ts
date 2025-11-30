/**
 * Multi-layer caching service with fallback support
 * Supports Redis (L2) and in-memory (L1) caching
 */

import type { Redis } from 'ioredis';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  accessTime: number;
}

interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  redisHits: number;
  redisMisses: number;
  totalSets: number;
  totalDeletes: number;
  memorySize: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService | null = null;
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private redisClient: Redis | null = null;
  private stats: CacheStats = {
    memoryHits: 0,
    memoryMisses: 0,
    redisHits: 0,
    redisMisses: 0,
    totalSets: 0,
    totalDeletes: 0,
    memorySize: 0,
    hitRate: 0
  };

  // Configuration
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly REDIS_KEY_PREFIX = 'email:cache:';

  private constructor() {
    this.initializeRedis();
    this.startCleanupTimer();
    this.updateStats();
  }

  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService();
    }
    return this.instance;
  }

  /**
   * Initialize Redis connection with fallback
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Only attempt Redis if URL is provided
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        const { Redis } = await import('ioredis');
        this.redisClient = new Redis(redisUrl);

        // Test connection
        await this.redisClient.ping();
        console.log('Redis cache connected successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Redis cache not available, using memory-only cache:', errorMessage);
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache (L1 memory -> L2 Redis -> null)
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: Check memory cache first
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.stats.memoryHits++;
      return memoryResult;
    }
    this.stats.memoryMisses++;

    // L2: Check Redis cache
    if (this.redisClient) {
      try {
        const redisKey = this.REDIS_KEY_PREFIX + key;
        const cached = await this.redisClient.get(redisKey);
        
        if (cached) {
          this.stats.redisHits++;
          const value = JSON.parse(cached);
          
          // Promote to L1 cache
          this.setInMemory(key, value, this.DEFAULT_TTL);
          return value;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Redis GET error for key ${key}:`, errorMessage);
      }
    }
    
    this.stats.redisMisses++;
    return null;
  }

  /**
   * Set value in both cache layers
   */
  async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    this.stats.totalSets++;

    // Set in L1 memory cache
    this.setInMemory(key, value, ttl);

    // Set in L2 Redis cache
    if (this.redisClient) {
      try {
        const redisKey = this.REDIS_KEY_PREFIX + key;
        await this.redisClient.setex(redisKey, ttl, JSON.stringify(value));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Redis SET error for key ${key}:`, errorMessage);
      }
    }
  }

  /**
   * Delete from both cache layers
   */
  async delete(key: string): Promise<void> {
    this.stats.totalDeletes++;

    // Delete from memory
    this.memoryCache.delete(key);

    // Delete from Redis
    if (this.redisClient) {
      try {
        const redisKey = this.REDIS_KEY_PREFIX + key;
        await this.redisClient.del(redisKey);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Redis DELETE error for key ${key}:`, errorMessage);
      }
    }
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    let deletedCount = 0;

    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (this.matchesPattern(key, pattern)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    // Invalidate Redis cache
    if (this.redisClient) {
      try {
        const redisPattern = this.REDIS_KEY_PREFIX + pattern;
        const keys = await this.redisClient.keys(redisPattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          deletedCount += keys.length;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Redis INVALIDATE error for pattern ${pattern}:`, errorMessage);
      }
    }

    return deletedCount;
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Memory cache operations
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access stats
    entry.hitCount++;
    entry.accessTime = now;

    return entry.value as T;
  }

  private setInMemory<T>(key: string, value: T, ttl: number): void {
    // Evict if at capacity
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      accessTime: Date.now()
    };

    this.memoryCache.set(key, entry);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Pattern matching utility
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Cleanup expired entries
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => this.memoryCache.delete(key));

      if (toDelete.length > 0) {
        console.debug(`Cache cleanup: removed ${toDelete.length} expired entries`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    setInterval(() => {
      const totalHits = this.stats.memoryHits + this.stats.redisHits;
      const totalMisses = this.stats.memoryMisses + this.stats.redisMisses;
      const totalRequests = totalHits + totalMisses;

      this.stats.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
      this.stats.memorySize = this.memoryCache.size;
    }, 10000); // Update every 10 seconds
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(this.REDIS_KEY_PREFIX + '*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Redis CLEAR error:', errorMessage);
      }
    }

    // Reset stats
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      totalSets: 0,
      totalDeletes: 0,
      memorySize: 0,
      hitRate: 0
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    memory: boolean;
    redis: boolean;
    stats: CacheStats;
  }> {
    const health = {
      memory: true,
      redis: false,
      stats: this.getStats()
    };

    // Test Redis connection
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        health.redis = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Redis health check failed:', errorMessage);
      }
    }

    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('Redis cache connection closed');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Redis shutdown error:', errorMessage);
      }
    }
    
    this.memoryCache.clear();
  }
}

// Singleton instance
export const cacheService = CacheService.getInstance();

// Cache key helpers
export const CacheKeys = {
  EMAIL_SETTINGS: 'email:settings:active',
  EMAIL_PROVIDER_HEALTH: (provider: string) => `email:health:${provider}`,
  FEATURE_TOGGLES: 'email:features:all',
  FEATURE_TOGGLE: (feature: string) => `email:feature:${feature}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
  AUDIT_LOG_COUNT: 'email:audit:count',
  PROVIDER_STATS: (provider: string) => `email:stats:${provider}`,
  EMAIL_QUOTA: (userId: string, window: string) => `email:quota:${userId}:${window}`
} as const;
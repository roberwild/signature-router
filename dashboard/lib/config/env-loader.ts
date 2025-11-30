import { db, platformConfigTable } from '@workspace/database';

/**
 * Configuration cache to avoid multiple database calls
 */
let configCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Load all configurations from the database into a Map
 */
async function loadConfigurationsFromDB(): Promise<Map<string, string>> {
  const now = Date.now();
  
  // Return cached configs if still valid
  if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
    return configCache;
  }
  
  try {
    const configs = await db
      .select({
        key: platformConfigTable.key,
        value: platformConfigTable.value,
        is_sensitive: platformConfigTable.is_sensitive
      })
      .from(platformConfigTable);
    
    configCache = new Map();
    for (const config of configs) {
      // For sensitive values, only load them if they're not empty
      if (config.is_sensitive && !config.value) {
        // Try to fall back to env variable for sensitive configs
        const envValue = process.env[config.key];
        if (envValue) {
          configCache.set(config.key, envValue);
        }
      } else {
        configCache.set(config.key, config.value);
      }
    }
    
    cacheTimestamp = now;
    return configCache;
  } catch (error) {
    console.error('Failed to load configurations from database:', error);
    // Fall back to empty map if database is not available
    return new Map();
  }
}

/**
 * Get a configuration value from the database or environment
 * Falls back to environment variable if not found in database
 */
export async function getConfig(key: string, defaultValue?: string): Promise<string | undefined> {
  try {
    const configs = await loadConfigurationsFromDB();
    const value = configs.get(key);
    
    if (value !== undefined && value !== '') {
      return value;
    }
    
    // Fall back to environment variable
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return envValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Failed to get config ${key}:`, error);
    // Fall back to environment variable on error
    return process.env[key] || defaultValue;
  }
}

/**
 * Get multiple configuration values at once
 */
export async function getConfigs(keys: string[]): Promise<Record<string, string | undefined>> {
  const configs = await loadConfigurationsFromDB();
  const result: Record<string, string | undefined> = {};
  
  for (const key of keys) {
    const value = configs.get(key) || process.env[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Clear the configuration cache to force reload from database
 */
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Check if a configuration exists (either in DB or env)
 */
export async function hasConfig(key: string): Promise<boolean> {
  const value = await getConfig(key);
  return value !== undefined && value !== '';
}

/**
 * Get all configurations with a specific prefix
 */
export async function getConfigsByPrefix(prefix: string): Promise<Record<string, string>> {
  const configs = await loadConfigurationsFromDB();
  const result: Record<string, string> = {};
  
  // Check database configs
  for (const [key, value] of configs.entries()) {
    if (key.startsWith(prefix) && value) {
      result[key] = value;
    }
  }
  
  // Also check environment variables
  for (const key in process.env) {
    if (key.startsWith(prefix) && !result[key] && process.env[key]) {
      result[key] = process.env[key]!;
    }
  }
  
  return result;
}

/**
 * Initialize configurations on app startup
 * This preloads the cache to avoid delays on first request
 */
export async function initializeConfigs() {
  try {
    await loadConfigurationsFromDB();
    console.log('Configurations loaded successfully');
  } catch (error) {
    console.error('Failed to initialize configurations:', error);
  }
}
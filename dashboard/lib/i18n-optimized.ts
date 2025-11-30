import { Locale } from './i18n';

// Enhanced caching with TTL
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

class TranslationCache {
  private cache = new Map<string, CacheEntry>();
  private ttl = 1000 * 60 * 60; // 1 hour TTL

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance
const translationCache = new TranslationCache();

// Preload critical translations
export async function preloadTranslations(locale: Locale): Promise<void> {
  const criticalNamespaces = ['common', 'navigation'];
  
  await Promise.all(
    criticalNamespaces.map(namespace => 
      import(`../app/[locale]/shared/translations/${namespace}/${locale}.json`)
        .then(module => {
          translationCache.set(`${locale}-shared-${namespace}`, module.default);
        })
        .catch(console.error)
    )
  );
}

// Lazy load translation with cache
export async function lazyLoadTranslation(
  locale: Locale,
  type: 'page' | 'shared',
  path: string
): Promise<unknown> {
  const cacheKey = `${locale}-${type}-${path}`;
  
  // Check cache first
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    let translationModule;
    if (type === 'page') {
      translationModule = await import(`../app/[locale]/${path}/translations/${locale}.json`);
    } else {
      translationModule = await import(`../app/[locale]/shared/translations/${path}/${locale}.json`);
    }
    
    translationCache.set(cacheKey, translationModule.default);
    return translationModule.default;
  } catch (error) {
    console.error(`Failed to load translation: ${cacheKey}`, error);
    return {};
  }
}

// Batch load translations
export async function batchLoadTranslations(
  locale: Locale,
  requests: Array<{ type: 'page' | 'shared'; path: string }>
): Promise<Record<string, unknown>> {
  const results = await Promise.allSettled(
    requests.map(req => lazyLoadTranslation(locale, req.type, req.path))
  );
  
  const translations: Record<string, unknown> = {};
  requests.forEach((req, index) => {
    const result = results[index];
    const key = req.type === 'page' ? req.path : req.path;
    translations[key] = result.status === 'fulfilled' ? result.value : {};
  });
  
  return translations;
}

// Store translations in localStorage for offline support
export function cacheToLocalStorage(locale: Locale, namespace: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `i18n_${locale}_${namespace}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    // Ignore localStorage errors (quota exceeded, etc.)
    console.warn('Failed to cache translation to localStorage:', error);
  }
}

export function getFromLocalStorage(locale: Locale, namespace: string): unknown | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `i18n_${locale}_${namespace}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const { data, timestamp } = JSON.parse(stored);
    
    // Check if data is older than 24 hours
    if (Date.now() - timestamp > 1000 * 60 * 60 * 24) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (_error) {
    return null;
  }
}

// Clean up old cached translations
export function cleanupLocalStorageCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  const now = Date.now();
  
  keys.forEach(key => {
    if (key.startsWith('i18n_')) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const { timestamp } = JSON.parse(stored);
          if (now - timestamp > 1000 * 60 * 60 * 24) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
}

// Optimized translation loader with fallback chain
export async function getOptimizedTranslation(
  locale: Locale,
  type: 'page' | 'shared',
  path: string,
  fallbackLocale: Locale = 'es'
): Promise<unknown> {
  // Try memory cache first
  const cacheKey = `${locale}-${type}-${path}`;
  const memCached = translationCache.get(cacheKey);
  if (memCached) return memCached;
  
  // Try localStorage cache
  const localCached = getFromLocalStorage(locale, `${type}_${path}`);
  if (localCached) {
    translationCache.set(cacheKey, localCached);
    return localCached;
  }
  
  // Load from file system
  try {
    const data = await lazyLoadTranslation(locale, type, path);
    cacheToLocalStorage(locale, `${type}_${path}`, data);
    return data;
  } catch (_error) {
    // Try fallback locale
    if (locale !== fallbackLocale) {
      return getOptimizedTranslation(fallbackLocale, type, path, fallbackLocale);
    }
    return {};
  }
}
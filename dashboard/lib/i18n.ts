export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Dictionary cache
const dictionaryCache = new Map<string, unknown>();

// For page-specific translations
export async function getPageDictionary(locale: Locale, pagePath: string) {
  const cacheKey = `${locale}-page-${pagePath}`;
  
  if (dictionaryCache.has(cacheKey)) {
    return dictionaryCache.get(cacheKey);
  }

  const cleanPath = pagePath.replace(/^\[locale\]\//, '');

  try {
    // Handle the dynamic import path correctly
    const dictionary = (await import(`../app/[locale]/${cleanPath}/translations/${locale}.json`)).default;
    dictionaryCache.set(cacheKey, dictionary);
    return dictionary;
  } catch (error) {
    console.error(`Failed to load page dictionary for ${locale}/${cleanPath}:`, error);
    
    if (locale !== defaultLocale) {
      return getPageDictionary(defaultLocale, pagePath);
    }
    
    return {};
  }
}

// For shared translations (common, navigation, forms, etc.)
export async function getSharedDictionary(locale: Locale, namespace: string) {
  const cacheKey = `${locale}-shared-${namespace}`;
  
  if (dictionaryCache.has(cacheKey)) {
    return dictionaryCache.get(cacheKey);
  }

  try {
    const dictionary = (await import(`../app/[locale]/shared/translations/${namespace}/${locale}.json`)).default;
    dictionaryCache.set(cacheKey, dictionary);
    return dictionary;
  } catch (error) {
    console.error(`Failed to load shared dictionary for ${locale}/${namespace}:`, error);
    
    if (locale !== defaultLocale) {
      return getSharedDictionary(defaultLocale, namespace);
    }
    
    return {};
  }
}

// Combined loader for page + shared dictionaries
export async function getPageWithSharedDictionaries(
  locale: Locale, 
  pagePath: string, 
  sharedNamespaces: string[] = ['common', 'navigation', 'forms']
) {
  const dictionaries: Record<string, unknown> = {};
  
  // Load page-specific translations
  dictionaries.page = await getPageDictionary(locale, pagePath);
  
  // Load shared translations
  for (const namespace of sharedNamespaces) {
    dictionaries[namespace] = await getSharedDictionary(locale, namespace);
  }
  
  return dictionaries;
}

// Browser locale detection
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // Check localStorage
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale && isValidLocale(storedLocale)) {
    return storedLocale as Locale;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (isValidLocale(browserLang)) {
    return browserLang as Locale;
  }
  
  return defaultLocale;
}

// Get nested translation value
export function getNestedTranslation(obj: unknown, path: string): string {
  const result = path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof result === 'string' ? result : path;
}

// Interpolate parameters in translation string
export function interpolate(text: string, params: Record<string, unknown> = {}): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}
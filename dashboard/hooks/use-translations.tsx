'use client';

import { useTranslationContext } from '@/components/providers/translation-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Locale, locales } from '@/lib/i18n';

export function useTranslations(namespace?: string) {
  const { t: contextT, locale, changeLocale, isLoading } = useTranslationContext();
  
  const t = (key: string, params?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    return contextT(fullKey, params);
  };
  
  return { t, locale, changeLocale, isLoading };
}

export function useLanguageSwitcher() {
  const { locale: currentLocale, changeLocale } = useTranslationContext();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLanguage = (newLocale: Locale) => {
    startTransition(() => {
      // Check if the path already has a locale prefix
      const hasLocalePrefix = locales.some(locale => 
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      );
      
      let newPath: string;
      
      if (hasLocalePrefix) {
        // Replace the existing locale with the new one
        newPath = pathname.replace(/^\/[^/]+/, `/${newLocale}`);
      } else {
        // Path doesn't have locale, add it
        newPath = `/${newLocale}${pathname}`;
      }
      
      // Update locale
      changeLocale(newLocale);
      
      // Navigate to translated path
      router.push(newPath);
    });
  };
  
  return {
    currentLocale,
    availableLocales: locales,
    switchLanguage,
    isPending,
  };
}
'use client';

import { createContext, useContext, useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale, getNestedTranslation, interpolate } from '@/lib/i18n';

interface TranslationContextType {
  locale: Locale;
  dictionaries: Record<string, unknown>;
  t: (key: string, params?: Record<string, unknown>) => string;
  changeLocale: (newLocale: Locale) => void;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: React.ReactNode;
  initialLocale: Locale;
  initialDictionaries: Record<string, unknown>;
  namespaces: string[];
}

export function TranslationProvider({
  children,
  initialLocale,
  initialDictionaries,
  namespaces: _namespaces,
}: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [dictionaries, _setDictionaries] = useState(initialDictionaries);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const t = useCallback((key: string, params?: Record<string, unknown>) => {
    const [namespace, ...keys] = key.includes(':') 
      ? key.split(':') 
      : ['common', key];
    
    const translationKey = keys.join(':');
    const dictionary = dictionaries[namespace] || {};
    const translation = getNestedTranslation(dictionary, translationKey);
    
    return params ? interpolate(translation, params) : translation;
  }, [dictionaries]);

  const changeLocale = useCallback((newLocale: Locale) => {
    startTransition(() => {
      setLocale(newLocale);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
      }
      
      // Update cookie
      document.cookie = `NEXT_LOCALE=${newLocale};max-age=2592000;path=/;SameSite=Lax`;
      
      // Navigate to new locale path
      const newPath = pathname.replace(/^\/[^/]+/, `/${newLocale}`);
      router.push(newPath);
      router.refresh();
    });
  }, [pathname, router]);

  return (
    <TranslationContext.Provider
      value={{
        locale,
        dictionaries,
        t,
        changeLocale,
        isLoading: isPending,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
}
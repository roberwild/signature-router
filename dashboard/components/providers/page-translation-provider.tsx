'use client';

import { createContext, useContext } from 'react';

interface PageTranslationContextType {
  translations: Record<string, unknown>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

const PageTranslationContext = createContext<PageTranslationContextType | undefined>(undefined);

interface PageTranslationProviderProps {
  children: React.ReactNode;
  translations: Record<string, unknown>;
}

export function PageTranslationProvider({ children, translations }: PageTranslationProviderProps) {
  const t = (key: string, params?: Record<string, unknown>) => {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
      }
      if (value === undefined) break;
    }

    if (typeof value !== 'string') return key;
    
    // Simple parameter interpolation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  return (
    <PageTranslationContext.Provider value={{ translations, t }}>
      {children}
    </PageTranslationContext.Provider>
  );
}

export function usePageTranslations() {
  const context = useContext(PageTranslationContext);
  if (!context) {
    throw new Error('usePageTranslations must be used within PageTranslationProvider');
  }
  return context;
}
import { getPageDictionary, type Locale } from '~/lib/i18n';
import { PerformancePageContent } from './performance-page-content';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { getSharedDictionary } from '@/lib/i18n';
import { type SystemPerformanceData } from '~/data/admin/get-system-performance';

interface PerformanceWrapperProps {
  locale: string;
  initialData: SystemPerformanceData;
}

export async function PerformanceWrapper({ locale, initialData }: PerformanceWrapperProps) {
  const performanceDict = await getPageDictionary(locale as Locale, 'admin/performance');

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/performance': performanceDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/performance', 'common', 'navigation', 'forms']}
    >
      <PerformancePageContent initialData={initialData} />
    </TranslationProvider>
  );
}
import { getPageDictionary, type Locale } from '~/lib/i18n';
import { getDashboardMetrics } from '~/data/admin/questionnaires/get-dashboard-metrics';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { getSharedDictionary } from '@/lib/i18n';
import { DashboardContent } from './dashboard-content';

interface QuestionnairesWrapperProps {
  locale: string;
}

export async function QuestionnairesWrapper({ locale }: QuestionnairesWrapperProps) {
  const questionnairesDict = await getPageDictionary(locale as Locale, 'admin/questionnaires');
  const initialMetrics = await getDashboardMetrics();

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/questionnaires': questionnairesDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/questionnaires', 'common', 'navigation', 'forms']}
    >
      <DashboardContent initialMetrics={initialMetrics} locale={locale} />
    </TranslationProvider>
  );
}
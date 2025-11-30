import { getPageDictionary, type Locale } from '~/lib/i18n';
import { getSharedDictionary } from '@/lib/i18n';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { EmailSettingsPageContent } from './email-settings-page-content';
import type { EmailSettingsFormData } from './types';

interface EmailSettingsWrapperProps {
  locale: string;
  currentSettings?: EmailSettingsFormData & { id?: string };
}

export async function EmailSettingsWrapper({ locale, currentSettings }: EmailSettingsWrapperProps) {
  const emailSettingsDict = await getPageDictionary(locale as Locale, 'admin/email-settings');

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/email-settings': emailSettingsDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/email-settings', 'common', 'navigation', 'forms']}
    >
      <EmailSettingsPageContent currentSettings={currentSettings} />
    </TranslationProvider>
  );
}
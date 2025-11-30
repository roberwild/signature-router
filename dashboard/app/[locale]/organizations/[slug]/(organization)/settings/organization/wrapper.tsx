import { getPageDictionary } from '@/lib/i18n';
import { TranslationProvider } from '@/components/providers/translation-provider';
import type { Locale } from '@/lib/i18n';

interface OrganizationSettingsWrapperProps {
  children: React.ReactNode;
  locale: Locale;
}

export async function OrganizationSettingsWrapper({ children, locale }: OrganizationSettingsWrapperProps) {
  // Load organization settings translations
  const organizationDictionary = await getPageDictionary(
    locale,
    'organizations/[slug]/(organization)/settings/organization'
  );

  // Load navigation translations directly
  const navigationDictionary = (await import(`@/app/[locale]/shared/translations/navigation/${locale}.json`)).default;

  return (
    <TranslationProvider
      initialLocale={locale}
      initialDictionaries={{
        organization: organizationDictionary,
        navigation: navigationDictionary
      }}
      namespaces={['organization', 'navigation']}
    >
      {children}
    </TranslationProvider>
  );
}
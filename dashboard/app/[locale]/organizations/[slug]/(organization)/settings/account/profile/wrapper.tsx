import { getPageDictionary } from '@/lib/i18n';
import { TranslationProvider } from '@/components/providers/translation-provider';
import type { Locale } from '@/lib/i18n';

interface ProfileWrapperProps {
  children: React.ReactNode;
  locale: Locale;
}

export async function ProfileWrapper({ children, locale }: ProfileWrapperProps) {
  // Load account settings translations
  const accountDictionary = await getPageDictionary(
    locale,
    'organizations/[slug]/(organization)/settings/account'
  );

  // Load navigation translations directly
  const navigationDictionary = (await import(`@/app/[locale]/shared/translations/navigation/${locale}.json`)).default;

  return (
    <TranslationProvider
      initialLocale={locale}
      initialDictionaries={{
        account: accountDictionary,
        navigation: navigationDictionary
      }}
      namespaces={['account', 'navigation']}
    >
      {children}
    </TranslationProvider>
  );
}
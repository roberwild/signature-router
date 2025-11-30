import { notFound } from 'next/navigation';
import { isValidLocale, getSharedDictionary, getPageDictionary, Locale, locales } from '@/lib/i18n';
import { TranslationProvider } from '@/components/providers/translation-provider';

const sharedNamespaces = ['common', 'navigation', 'forms', 'auth', 'onboarding'];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const resolvedParams = await params;

  if (!isValidLocale(resolvedParams.locale)) {
    notFound();
  }

  const locale = resolvedParams.locale as Locale;

  // Load shared translations including auth
  const dictionaries: Record<string, unknown> = {};
  for (const namespace of sharedNamespaces) {
    if (namespace === 'auth' || namespace === 'onboarding') {
      dictionaries[namespace] = await getPageDictionary(locale, namespace);
    } else {
      dictionaries[namespace] = await getSharedDictionary(locale, namespace);
    }
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = '${locale}';`,
        }}
      />
      <TranslationProvider
        initialLocale={locale}
        initialDictionaries={dictionaries}
        namespaces={sharedNamespaces}
      >
        {children}
      </TranslationProvider>
    </>
  );
}
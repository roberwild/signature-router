import { getPageDictionary, type Locale } from '~/lib/i18n';
import { ConfigurationPageContent } from './configuration-page-content';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { getSharedDictionary } from '@/lib/i18n';
import { getConfigurations } from '~/data/admin/get-configurations';
import { getConfigAuditLogs, getConfigAuditUsers } from '~/data/admin/get-config-audit-logs';
import type { ConfigAuditLogEntry } from './audit-log-client';

interface ConfigurationWrapperProps {
  locale: string;
  searchParams: {
    tab?: string;
    page?: string;
    userId?: string;
    configKey?: string;
  };
}

export async function ConfigurationWrapper({ locale, searchParams }: ConfigurationWrapperProps) {
  const configDict = await getPageDictionary(locale as Locale, 'admin/configuration');

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/configuration': configDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  // Fetch data on server side
  let configData = null;
  let auditData = null;
  let auditUsers: Array<{
    id: string;
    name: string;
    email: string;
  }> = [];
  let error = null;

  try {
    configData = await getConfigurations(true);

    // Fetch audit data if on audit tab
    if (searchParams.tab === 'audit') {
      const page = parseInt(searchParams.page || '1');
      const rawAuditData = await getConfigAuditLogs({
        page,
        userId: searchParams.userId,
        configKey: searchParams.configKey
      });
      auditData = {
        data: rawAuditData.data as ConfigAuditLogEntry[],
        pagination: rawAuditData.pagination
      };
      auditUsers = await getConfigAuditUsers() as unknown as Array<{
        id: string;
        name: string;
        email: string;
      }>;
    }
  } catch (e) {
    console.error('Configuration page error:', e);
    error = e instanceof Error ? e.message : 'Failed to load data';
    configData = { configs: [], groupedConfigs: {}, total: 0 };
  }

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/configuration', 'common', 'navigation', 'forms']}
    >
      <ConfigurationPageContent
        locale={locale}
        searchParams={searchParams}
        initialData={configData}
        initialAuditData={auditData}
        initialAuditUsers={auditUsers}
        initialError={error}
      />
    </TranslationProvider>
  );
}
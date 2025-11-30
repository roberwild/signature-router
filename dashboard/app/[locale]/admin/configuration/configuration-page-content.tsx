'use client';

import Link from 'next/link';
import { AlertCircle, History, Settings } from 'lucide-react';

import { useTranslations } from '~/hooks/use-translations';
import {
  Page,
  PageBody,
  PageHeader,
} from '@workspace/ui/components/page';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { ConfigurationPageHeader } from './configuration-page-header';
import { ConfigurationListClient } from './configuration-list-client';
import { AuditLogClient } from './audit-log-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ConfigAuditLogEntry } from './audit-log-client';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AuditUser {
  id: string;
  name: string;
  email: string;
}

interface ConfigurationPageContentProps {
  locale: string;
  searchParams: {
    tab?: string;
    page?: string;
    userId?: string;
    configKey?: string;
  };
  initialData: ConfigurationData | null;
  initialAuditData: { data: ConfigAuditLogEntry[]; pagination: PaginationInfo } | null;
  initialAuditUsers: AuditUser[];
  initialError: string | null;
}

interface PlatformConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  is_sensitive: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

interface ConfigurationData {
  configs: PlatformConfig[];
  groupedConfigs: Record<string, PlatformConfig[]>;
  total: number;
}

export function ConfigurationPageContent({
  locale,
  searchParams,
  initialData,
  initialAuditData,
  initialAuditUsers,
  initialError
}: ConfigurationPageContentProps) {
  const { t } = useTranslations('admin/configuration');
  const currentTab = searchParams.tab || 'configuration';

  return (
    <Page>
      <PageHeader>
        <ConfigurationPageHeader
          locale={locale}
          configCount={initialData?.total || 0}
        />
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {initialError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">{t('errorTitle')}</AlertTitle>
                <AlertDescription className="mt-1">
                  {initialError}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Tabs defaultValue="configuration" value={currentTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuration" asChild>
                <Link href={`/${locale}/admin/configuration?tab=configuration`}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('tabs.configuration')}
                </Link>
              </TabsTrigger>
              <TabsTrigger value="audit" asChild>
                <Link href={`/${locale}/admin/configuration?tab=audit`}>
                  <History className="mr-2 h-4 w-4" />
                  {t('tabs.auditLog')}
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configuration" className="space-y-4">
              <ConfigurationListClient
                configs={initialData?.configs || []}
                groupedConfigs={initialData?.groupedConfigs || {}}
                locale={locale}
              />
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              {initialAuditData && (
                <AuditLogClient
                  initialLogs={initialAuditData.data}
                  users={initialAuditUsers}
                  pagination={initialAuditData.pagination}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageBody>
    </Page>
  );
}
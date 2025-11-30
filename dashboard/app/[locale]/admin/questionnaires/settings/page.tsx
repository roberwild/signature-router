import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { GlobalSettingsManager } from './global-settings-manager';
import { getGlobalSettings } from '~/data/admin/questionnaires/get-global-settings';

export default async function GlobalSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('settings.write');
  const { locale } = await params;
  
  const settings = await getGlobalSettings();
  
  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Settings" />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Global Questionnaire Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings that affect all questionnaire interactions
          </p>
        </div>
        
        <Suspense fallback={<SettingsSkeleton />}>
          <GlobalSettingsManager initialSettings={settings} locale={locale} />
        </Suspense>
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
      <div className="flex justify-end gap-2">
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        <div className="h-10 w-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
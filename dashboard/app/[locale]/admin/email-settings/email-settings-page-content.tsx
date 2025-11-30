'use client';

import { Mail } from 'lucide-react';
import { useTranslations } from '~/hooks/use-translations';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { AdminPageTitle } from '../components/admin-page-title';
import { EmailSettingsTabs } from './components/email-settings-tabs';
import type { EmailSettingsFormData } from './types';

interface EmailSettingsPageContentProps {
  currentSettings?: EmailSettingsFormData & { id?: string };
}

export function EmailSettingsPageContent({ currentSettings }: EmailSettingsPageContentProps) {
  const t = useTranslations('admin/email-settings');

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title={t('page.title')}
              info={t('page.info')}
            />
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          <EmailSettingsTabs initialSettings={currentSettings} />
        </div>
      </PageBody>
    </Page>
  );
}
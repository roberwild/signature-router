'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useTranslations } from '~/hooks/use-translations';
import { AdminPageTitle } from '../components/admin-page-title';
import { Button } from '@workspace/ui/components/button';
import { PageActions, PagePrimaryBar } from '@workspace/ui/components/page';

interface ConfigurationPageHeaderProps {
  locale: string;
  configCount: number;
}

export function ConfigurationPageHeader({ locale, configCount }: ConfigurationPageHeaderProps) {
  const { t } = useTranslations('admin/configuration');

  return (
    <>
      <PagePrimaryBar>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <AdminPageTitle
            title={t('pageTitle')}
            info={t('info', { count: configCount })}
          />
        </div>
      </PagePrimaryBar>
      <PageActions>
        <Link href={`/${locale}/admin`}>
          <Button variant="outline">{t('backToDashboard')}</Button>
        </Link>
      </PageActions>
    </>
  );
}
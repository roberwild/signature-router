'use client';

import { Target } from 'lucide-react';
import { useTranslations } from '~/hooks/use-translations';
import { AdminPageTitle } from '../components/admin-page-title';

export function LeadsPageHeader() {
  const { t } = useTranslations('admin/leads');

  return (
    <div className="flex items-center gap-2">
      <Target className="h-6 w-6 text-primary" />
      <AdminPageTitle
        title={t('title')}
        info={t('subtitle')}
      />
    </div>
  );
}
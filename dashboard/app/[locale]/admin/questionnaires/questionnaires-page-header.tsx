'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from '~/hooks/use-translations';
import { AdminPageTitle } from '../components/admin-page-title';

export function QuestionnairesPageHeader() {
  const { t } = useTranslations('admin/questionnaires');

  return (
    <div className="flex items-center gap-2">
      <ClipboardList className="h-6 w-6 text-primary" />
      <AdminPageTitle
        title={t('title')}
        info={t('subtitle')}
      />
    </div>
  );
}
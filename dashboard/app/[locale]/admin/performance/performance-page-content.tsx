'use client';

import { Suspense } from 'react';
import { PerformanceMonitoring } from './performance-monitoring';
import { useTranslations } from '~/hooks/use-translations';
import { type SystemPerformanceData } from '~/data/admin/get-system-performance';

interface PerformancePageContentProps {
  initialData: SystemPerformanceData;
}

export function PerformancePageContent({ initialData }: PerformancePageContentProps) {
  const { t } = useTranslations('admin/performance');

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>

        <Suspense fallback={<div>{t('loading')}</div>}>
          <PerformanceMonitoring initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}
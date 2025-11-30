import { requirePermission } from '~/lib/admin/permissions';
import { getSystemPerformanceData } from '~/data/admin/get-system-performance';
import { PerformanceWrapper } from './performance-wrapper';

export default async function PerformanceMonitoringPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');

  const { locale } = await params;
  const performanceData = await getSystemPerformanceData();

  return (
    <PerformanceWrapper locale={locale} initialData={performanceData} />
  );
}

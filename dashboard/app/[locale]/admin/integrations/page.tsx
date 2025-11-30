import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { getIntegrationData } from '~/data/admin/get-integration-data';

export default async function IntegrationsPage({
  params: _params
}: {
  params: { locale: string };
}) {
  await requirePermission('SYSTEM_ADMIN');

  const _integrationData = await getIntegrationData();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Integration Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with CRM systems, email platforms, and marketing tools
          </p>
        </div>

        <Suspense fallback={<div>Loading integrations...</div>}>
          <div className="text-center text-muted-foreground">
            Integration components not implemented yet.
          </div>
        </Suspense>
      </div>
    </div>
  );
}

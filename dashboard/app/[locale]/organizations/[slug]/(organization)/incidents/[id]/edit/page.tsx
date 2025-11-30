import * as React from 'react';
import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { Edit, Shield } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Badge } from '@workspace/ui/components/badge';

import { createTitle } from '~/lib/formatters';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { EditIncidentForm } from '~/src/features/incidents/components/edit-incident-form';

export const metadata: Metadata = {
  title: createTitle('Editar Incidente')
};

interface EditIncidentPageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default async function EditIncidentPage({ params }: EditIncidentPageProps) {
  const session = await auth();
  const { slug, id } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch incident data
  const incidentData = await incidentDb.getIncidentWithHistory(id);

  if (!incidentData) {
    notFound();
  }

  // Verify the incident belongs to this organization
  if (incidentData.incident.organizationId !== organizationId) {
    notFound();
  }

  const latestVersion = incidentData.versions[0];

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title={`Editar Incidente #${incidentData.incident.internalId}`}
              info="Actualiza la información del incidente y genera un nuevo token de verificación"
            />
            <Badge variant="secondary">
              <Shield className="mr-1 h-3 w-3" />
              Versión {latestVersion.versionNumber}
            </Badge>
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <EditIncidentForm 
            incident={incidentData.incident}
            latestVersion={latestVersion}
            organizationId={organizationId}
            userId={session.user.id!}
            slug={slug}
          />
        </div>
      </PageBody>
    </Page>
  );
}
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Clock, AlertTriangle } from 'lucide-react';
import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { Badge } from '@workspace/ui/components/badge';

import { IncidentReportWizardSimple } from '~/src/features/incidents/components/incident-report-wizard-simple';
import { PageHeader } from '~/components/organizations/slug/page-header';

export const metadata: Metadata = {
  title: 'Registrar Incidente | RGPD Art. 33',
  description: 'Registro de violación de datos personales a la autoridad de control - Formulario oficial',
};

interface NewIncidentPageProps {
  params: {
    slug: string;
  };
}

export default async function NewIncidentPage({ params }: NewIncidentPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // TODO: Check if organization has active subscription for incidents feature
  const hasSubscription = true; // Placeholder

  if (!hasSubscription) {
    redirect(`/organizations/${slug}/incidents`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Registrar Violación de Datos Personales"
        description="Según el Artículo 33 del RGPD - Documentación obligatoria para autoridades de control"
        icon="FileWarning"
        badges={[
          {
            text: 'Plazo: 72 horas',
            variant: 'destructive'
          },
          {
            text: 'RGPD Art. 33',
            variant: 'outline'
          }
        ]}
        actions={[
          // TODO: Add save draft functionality
          // {
          //   label: 'Guardar Borrador',
          //   variant: 'outline',
          //   onClick: () => {
          //     // Save draft functionality
          //   }
          // }
        ]}
      />
      
      {/* Alert Banner */}
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Tiempo crítico: La notificación debe realizarse en un plazo máximo de 72 horas desde el conocimiento de la brecha
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            El incumplimiento puede conllevar sanciones de hasta 10M€ o 2% del volumen de negocio anual
          </p>
        </div>
        <Badge variant="destructive" className="shrink-0">
          <Clock className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      </div>
      
      {/* Form Content */}
      <div className="space-y-6">
        <IncidentReportWizardSimple 
          organizationId={organizationId}
          organizationSlug={slug}
          userId={session.user.id!}
        />
      </div>
    </div>
  );
}
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Shield, Search } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import Link from 'next/link';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

import { IncidentsTanstackTable } from '~/src/features/incidents/components/incidents-tanstack-table';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { LoadingCard } from '~/components/organizations/slug/home/loading-card';

export const metadata: Metadata = {
  title: 'Registro de Incidentes | Ciberseguridad',
  description: 'Gestiona tu registro de incidentes de ciberseguridad según RGPD Art. 33',
};

interface IncidentsPageProps {
  params: {
    slug: string;
  };
}

export default async function IncidentsPage({ params }: IncidentsPageProps) {
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
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Registro de Incidentes de Ciberseguridad
              </CardTitle>
              <CardDescription>
                Cumple con la obligación legal de mantener un registro según AEPD (RGPD Art. 33)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Funcionalidades Premium</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Registro ilimitado de incidentes</li>
                  <li>✓ Versionado y trazabilidad completa</li>
                  <li>✓ Tokens únicos para verificación</li>
                  <li>✓ Portal público de consulta</li>
                  <li>✓ Campos obligatorios AEPD</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">3,99 €/mes</p>
                <p className="text-sm text-muted-foreground">
                  o 39,99 €/año (ahorra 17%)
                </p>
              </div>
              <Button size="lg" className="w-full max-w-sm">
                Suscribirse Ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch incidents for the organization
  const incidents = await incidentDb.getOrganizationIncidents(organizationId);

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <OrganizationPageTitle
                title="Registro de Incidentes"
                info="Gestiona y documenta los incidentes de ciberseguridad de tu organización"
              />
            </div>
            <PageActions className="flex flex-row gap-2 w-full sm:w-auto flex-shrink-0">
              <Link
                href={`/organizations/${slug}/incidents/verify`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }), 
                  'flex-1 sm:flex-initial'
                )}
              >
                <Search className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Buscar</span>
              </Link>
              <Link
                href={`/organizations/${slug}/incidents/new`}
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }), 
                  'flex-1 sm:flex-initial'
                )}
              >
                <Shield className="mr-1 sm:mr-2 h-4 w-4" />
                <span>Nuevo</span>
              </Link>
            </PageActions>
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="w-full max-w-full mx-auto lg:max-w-7xl space-y-4 sm:space-y-6 p-3 sm:p-6 overflow-x-hidden box-border">

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 min-w-0 max-w-full">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Incidentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
              Registros totales
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {incidents.filter(i => i.latestVersion && !i.latestVersion.fechaResolucion).length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
              Pendientes resolución
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Resueltos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {incidents.filter(i => i.latestVersion?.fechaResolucion).length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
              Casos cerrados
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Notificados AEPD
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {incidents.filter(i => i.latestVersion?.notificadoAEPD).length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
              Cumplimiento RGPD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Suspense fallback={<LoadingCard />}>
        <Card>
          <CardHeader>
            <CardTitle>Incidentes Registrados</CardTitle>
            <CardDescription>
              Haz clic en cualquier incidente para ver más detalles o actualizar su información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <IncidentsTanstackTable
              incidents={incidents}
              organizationSlug={slug}
            />
          </CardContent>
        </Card>
      </Suspense>
        </div>
      </PageBody>
    </Page>
  );
}
import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle,   ArrowRight, Shield } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Badge } from '@workspace/ui/components/badge';

import { createTitle } from '~/lib/formatters';
import { TokenDisplay } from '~/src/features/incidents/components/token-display';

export const metadata: Metadata = {
  title: createTitle('Incidente Actualizado')
};

interface SuccessPageProps {
  params: {
    slug: string;
    id: string;
  };
  searchParams: {
    token?: string;
  };
}

export default async function UpdateSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { slug, id } = await params;
  const { token } = searchParams;

  if (!token) {
    redirect(`/organizations/${slug}/incidents/${id}`);
  }

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <OrganizationPageTitle
              title="Incidente Actualizado Exitosamente"
              info="Se ha generado un nuevo token de verificación para esta versión"
            />
            <Badge variant="default" className="bg-green-600">
              <Shield className="mr-1 h-3 w-3" />
              Nueva Versión
            </Badge>
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="ml-6 mt-1 text-green-900">
                Actualización Completada
              </AlertTitle>
              <AlertDescription className="mt-1 text-green-800">
                El incidente ha sido actualizado correctamente y se ha generado un nuevo token de verificación.
                Guarde este token para futuras consultas y verificaciones.
              </AlertDescription>
            </Alert>

            {/* Token Display */}
            <Card>
              <CardHeader>
                <CardTitle>Nuevo Token de Verificación</CardTitle>
                <CardDescription>
                  Este token único identifica la versión actual del incidente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Token de Verificación:</p>
                    <code className="text-lg font-mono font-bold break-all">
                      {token}
                    </code>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle className="ml-6 mt-1">Importante</AlertTitle>
                    <AlertDescription className="mt-1">
                      Guarde este token de forma segura. Lo necesitará para:
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>Verificar la autenticidad de esta versión del incidente</li>
                        <li>Compartir con las autoridades competentes</li>
                        <li>Acceder al portal público de verificación</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <TokenDisplay 
                    token={token}
                    versionNumber={0}
                    totalVersions={0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pasos</CardTitle>
                <CardDescription>
                  Acciones recomendadas después de actualizar el incidente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link 
                    href={`/organizations/${slug}/incidents/${id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">Ver Detalles del Incidente</p>
                      <p className="text-sm text-muted-foreground">
                        Consulte la información completa y el historial
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link 
                    href={`/organizations/${slug}/incidents/${id}/history`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">Ver Historial de Versiones</p>
                      <p className="text-sm text-muted-foreground">
                        Revise todas las versiones anteriores del incidente
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link 
                    href={`/organizations/${slug}/incidents`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">Volver al Registro</p>
                      <p className="text-sm text-muted-foreground">
                        Regrese a la lista de incidentes
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
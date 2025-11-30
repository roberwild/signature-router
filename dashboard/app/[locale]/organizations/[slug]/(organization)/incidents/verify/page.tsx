import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Search, Shield, CheckCircle, AlertCircle, Clock, Lock } from 'lucide-react';

import { createTitle } from '~/lib/formatters';
import { TokenQueryForm } from '~/src/features/incidents/components/token-query-form';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

export const metadata: Metadata = {
  title: createTitle('Verificar Token de Incidente')
};

export default async function TokenQueryPage(
  props: NextPageProps
): Promise<React.JSX.Element> {
  const params = await props.params;
  
  async function verifyToken(token: string) {
    'use server';
    
    const { getIncidentByToken } = await import('~/src/features/incidents/data/incident-db');
    const incident = await getIncidentByToken(token);
    
    if (incident) {
      redirect(`/organizations/${params.slug}/incidents/${incident.incident.id}`);
    }
    
    return { error: 'Token no encontrado' };
  }

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <OrganizationPageTitle
                title="Verificar Token de Incidente"
                info="Consulta el estado y detalles de un incidente utilizando su token único"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Acceso Seguro
            </Badge>
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Verificación de Incidentes</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Ingrese el token único para acceder a la información completa del incidente
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Token Form - Main Focus */}
            <div className="lg:col-span-2">
              <TokenQueryForm onVerify={verifyToken} />
              
              {/* Security Notice */}
              <Alert className="mt-4 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="ml-6 text-blue-900 dark:text-blue-200">
                  <strong>Verificación Segura:</strong> Este proceso garantiza que solo personas autorizadas 
                  puedan acceder a la información sensible del incidente.
                </AlertDescription>
              </Alert>
            </div>

            {/* Side Information */}
            <div className="space-y-4">
              {/* Features Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Qué puede hacer con el token?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Ver estado actual</p>
                      <p className="text-xs text-muted-foreground">
                        Consulte el estado y progreso del incidente
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Historial completo</p>
                      <p className="text-xs text-muted-foreground">
                        Acceda a todas las actualizaciones y cambios
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Detalles técnicos</p>
                      <p className="text-xs text-muted-foreground">
                        Revise información técnica y evidencias
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">¿Necesita ayuda?</CardTitle>
                  <CardDescription className="text-xs">
                    Si no puede encontrar su token o tiene problemas para acceder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Contacte al coordinador de incidentes o revise su correo de confirmación.
                    </p>
                    <a 
                      href="https://wa.me/message/C35F4AFPXDNUK1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-green-600 hover:text-green-700 transition-colors"
                    >
                      <svg 
                        className="h-5 w-5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Contáctanos por WhatsApp
                    </a>
                    <p className="font-medium text-primary">
                      contacto@mineryreport.com
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Information Section */}
          <div className="mt-8 grid gap-4 rounded-lg border bg-muted/30 p-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Seguro y Encriptado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Acceso Disponible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Instantáneo</div>
              <div className="text-sm text-muted-foreground">Verificación Inmediata</div>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
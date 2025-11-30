import * as React from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronRightIcon, AlertTriangleIcon } from 'lucide-react';

import { routes } from '@workspace/routes';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

import { GridSection } from '~/components/fragments/grid-section';
import { SiteHeading } from '~/components/fragments/site-heading';

enum Feature {
  CyberAssessment = 'Evaluación de Ciberseguridad',
  IncidentRegistry = 'Registro de Incidentes GDPR',
  ImmutableTokens = 'Tokens SHA256 Inmutables',
  PublicVerification = 'Portal de Verificación Pública',
  VersionHistory = 'Historial de Versiones',
  CloudStorage = 'Almacenamiento en la Nube',
  Support = 'Soporte',
  Users = 'Usuarios',
  Incidents = 'Incidentes por mes'
}

const plans = {
  free: {
    [Feature.CyberAssessment]: 'Ilimitadas',
    [Feature.Users]: 'Hasta 3 usuarios',
    [Feature.Support]: 'Comunidad'
  },
  monthly: {
    [Feature.CyberAssessment]: 'Ilimitadas',
    [Feature.IncidentRegistry]: 'Completo con AEPD',
    [Feature.ImmutableTokens]: 'Incluido',
    [Feature.PublicVerification]: 'Incluido',
    [Feature.VersionHistory]: 'Ilimitado',
    [Feature.CloudStorage]: '10 GB',
    [Feature.Users]: 'Hasta 10 usuarios',
    [Feature.Incidents]: 'Ilimitados',
    [Feature.Support]: 'Email en 24h'
  },
  annual: {
    [Feature.CyberAssessment]: 'Ilimitadas',
    [Feature.IncidentRegistry]: 'Completo con AEPD',
    [Feature.ImmutableTokens]: 'Incluido',
    [Feature.PublicVerification]: 'Incluido',
    [Feature.VersionHistory]: 'Ilimitado',
    [Feature.CloudStorage]: '50 GB',
    [Feature.Users]: 'Hasta 25 usuarios',
    [Feature.Incidents]: 'Ilimitados',
    [Feature.Support]: 'Prioritario'
  },
  triennial: {
    [Feature.CyberAssessment]: 'Ilimitadas',
    [Feature.IncidentRegistry]: 'Completo con AEPD',
    [Feature.ImmutableTokens]: 'Incluido',
    [Feature.PublicVerification]: 'Incluido',
    [Feature.VersionHistory]: 'Ilimitado',
    [Feature.CloudStorage]: '100 GB',
    [Feature.Users]: 'Ilimitados',
    [Feature.Incidents]: 'Ilimitados',
    [Feature.Support]: 'Dedicado 24/7'
  }
} as const;

export function PricingPlans(): React.JSX.Element {
  return (
    <GridSection>
      <div className="container space-y-20 py-20">
        <SiteHeading
          badge="Precios"
          title="€3,99 vs €10.000.000"
          description="La inversión más inteligente para proteger tu empresa. Menos que un café al mes para evitar multas millonarias."
        />

        <div className="max-w-7xl">
          <div className="mb-12 rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/20">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-4">
                <AlertTriangleIcon className="size-12 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    Coste de NO tener protección: <span className="text-3xl">€10.000.000</span>
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Multa máxima GDPR por incumplimiento del Artículo 33
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg font-semibold text-green-600">
                  Tu inversión: Desde €3,99/mes
                </p>
                <p className="text-sm text-muted-foreground">
                  Menos que un café para evitar la ruina
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="grid w-full max-w-7xl gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <FreeTierCard />
              <MonthlyTierCard />
              <AnnualTierCard />
              <TriennialTierCard />
            </div>
          </div>
        </div>
      </div>
    </GridSection>
  );
}

function FreeTierCard(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-lg border p-6">
      <div className="relative z-10 grow">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-medium">Evaluación Gratuita</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">€0</span>
            <span className="ml-2 text-muted-foreground">/siempre</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Evalúa tu ciberseguridad sin coste
          </p>
        </div>
        <ul className="mb-6 space-y-3">
          {Object.keys(plans.free).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-green-600" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-xs text-muted-foreground">
                  {plans.free[key as keyof typeof plans.free]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.dashboard.auth.SignUp}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'group mt-auto h-11 w-full rounded-xl text-sm font-medium shadow-none transition-colors duration-200'
        )}
      >
        Empezar Gratis
        <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function MonthlyTierCard(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-lg border p-6">
      <div className="relative z-10 grow">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-medium">Mensual</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">€3,99</span>
            <span className="ml-2 text-muted-foreground">/mes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Protección básica GDPR
          </p>
        </div>
        <ul className="mb-6 space-y-3">
          {Object.keys(plans.monthly).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-green-600" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-xs text-muted-foreground">
                  {plans.monthly[key as keyof typeof plans.monthly]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.dashboard.organizations.Index}
        className={cn(
          buttonVariants({ variant: 'default' }),
          'group mt-auto h-11 w-full rounded-xl text-sm font-medium shadow-none transition-colors duration-200'
        )}
      >
        Empezar Ahora
        <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function AnnualTierCard(): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-col rounded-lg border border-primary p-6">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium uppercase text-primary-foreground">
          Recomendado
        </span>
      </div>
      <div className="relative z-10 grow">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-medium">Anual</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">€39,99</span>
            <span className="ml-2 text-muted-foreground">/año</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-green-600">Ahorra 17%</span> - Mejor valor
          </p>
        </div>
        <ul className="mb-6 space-y-3">
          {Object.keys(plans.annual).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-green-600" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-xs text-muted-foreground">
                  {plans.annual[key as keyof typeof plans.annual]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.dashboard.organizations.Index}
        className={cn(
          buttonVariants({ variant: 'default' }),
          'group mt-auto h-11 w-full rounded-xl text-sm font-medium shadow-none transition-colors duration-200'
        )}
      >
        Ahorrar 17%
        <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function TriennialTierCard(): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-col rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-medium uppercase text-white">
          Máximo Ahorro
        </span>
      </div>
      <div className="relative z-10 grow">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-medium">3 Años</h2>
          <div className="mb-2 flex items-baseline">
            <span className="text-4xl font-bold">€99,99</span>
            <span className="ml-2 text-muted-foreground">/3 años</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-orange-600">Ahorra 30%</span> - Tranquilidad total
          </p>
        </div>
        <ul className="mb-6 space-y-3">
          {Object.keys(plans.triennial).map((key) => (
            <li
              key={key}
              className="flex items-start"
            >
              <CheckIcon className="mt-1 size-4 text-orange-600" />
              <div className="ml-3">
                <div className="text-sm font-medium">{key}</div>
                <div className="text-xs text-muted-foreground">
                  {plans.triennial[key as keyof typeof plans.triennial]}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={routes.dashboard.organizations.Index}
        className={cn(
          buttonVariants({ variant: 'default' }),
          'group mt-auto h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-none transition-colors duration-200 hover:from-amber-600 hover:to-orange-600'
        )}
      >
        Máximo Ahorro
        <ChevronRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

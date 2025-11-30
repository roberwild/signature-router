import * as React from 'react';
import { CircleCheckBigIcon, ShieldCheckIcon, LockIcon, ClockIcon, DatabaseIcon, UsersIcon, HistoryIcon } from 'lucide-react';

import { APP_NAME } from '@workspace/common/app';

import { FeatureCard } from '~/components/cards/feature-card';
import { AiAdvisorCard } from '~/components/cards/ai-advisor-card';
import { GridSection } from '~/components/fragments/grid-section';

export function Solution(): React.JSX.Element {
  return (
    <GridSection id="soluciones">
      <div className="bg-diagonal-lines">
        <div className="flex flex-col gap-12 sm:gap-16 md:gap-24 bg-background py-12 sm:py-16 md:py-20 lg:mx-12 lg:border-x">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 space-y-6 sm:space-y-8 md:space-y-10 max-w-7xl mx-auto">
            <div className="text-center sm:text-left">
              <h2 className="mb-2.5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
                Tu escudo legal contra sanciones
              </h2>
              <p className="mt-3 sm:mt-4 md:mt-6 max-w-2xl mx-auto sm:mx-0 text-sm sm:text-base text-muted-foreground">
                {APP_NAME} transforma el caos del cumplimiento GDPR en un sistema ordenado y verificable. 
                Cada incidente genera un token SHA256 inmutable que prueba tu cumplimiento ante cualquier auditoría.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pr-3 sm:pr-0">
              <FeatureCard
                icon={<ShieldCheckIcon className="size-6 text-primary" />}
                title="Tokens SHA256 Inmutables"
                description="Cada incidente genera un token único e inmodificable que sirve como prueba irrefutable ante la AEPD."
                highlight="Verificación instantánea"
              />
              <FeatureCard
                icon={<LockIcon className="size-6 text-primary" />}
                title="Portal de Verificación Pública"
                description="Permite a auditores y autoridades verificar la autenticidad de cualquier incidente sin acceso al sistema."
                highlight="Sin autenticación requerida"
              />
              <FeatureCard
                icon={<HistoryIcon className="size-6 text-primary" />}
                title="Versionado Blockchain"
                description="Cada modificación crea una nueva versión con su propio token, manteniendo un historial completo e inmutable."
                highlight="Trazabilidad total"
              />
              <FeatureCard
                icon={<ClockIcon className="size-6 text-primary" />}
                title="Control de 72 Horas"
                description="Visualiza el tiempo restante para cumplir con el plazo legal de notificación a la AEPD."
                highlight="Alertas visuales"
              />
              <FeatureCard
                icon={<DatabaseIcon className="size-6 text-primary" />}
                title="Almacenamiento en la Nube"
                description="Tus datos siempre seguros y accesibles, sin riesgo de pérdida por archivos locales o empleados que se marchan."
                highlight="Backup automático"
              />
              <FeatureCard
                icon={<UsersIcon className="size-6 text-primary" />}
                title="Acceso Organizacional"
                description="El conocimiento permanece en la empresa, no en personas individuales. Perfecto para auditorías."
                highlight="Multi-usuario seguro"
              />
            </div>
            <div className="border-t border-dashed" />
            <div id="servicios" className="grid gap-6 sm:gap-8 md:gap-10 lg:grid-cols-2">
              <div className="order-1 lg:order-2 text-center sm:text-left">
                <h2 className="mb-2.5 mt-4 sm:mt-6 md:mt-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold break-words">
                  Sistema de protección completo
                </h2>
                <p className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base text-muted-foreground">
                  Cada funcionalidad está diseñada para protegerte ante la AEPD y 
                  garantizar que nunca pierdas el control de tu cumplimiento.
                </p>
                <ul className="mt-4 sm:mt-5 md:mt-6 list-none space-y-2 sm:space-y-3 md:flex md:flex-wrap md:items-center md:gap-6 md:space-y-0">
                  {[
                    'Tokens SHA256 inmutables',
                    'Portal de verificación pública',
                    'Historial blockchain de versiones',
                    'Almacenamiento en la nube',
                    'Acceso a nivel organización',
                    'Trazabilidad completa'
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex flex-row items-center gap-1.5 sm:gap-2"
                    >
                      <CircleCheckBigIcon className="size-3.5 sm:size-4 shrink-0 text-primary" />
                      <span className="text-sm sm:text-base font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-2 md:order-1 flex justify-center lg:justify-start">
                <AiAdvisorCard className="w-full max-w-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GridSection>
  );
}

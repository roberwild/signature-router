import * as React from 'react';
import { AlertTriangleIcon, ClockIcon, BrainIcon, FileXIcon } from 'lucide-react';

import { BlurFade } from '~/components/fragments/blur-fade';
import { GridSection } from '~/components/fragments/grid-section';
import { TextGenerateEffect } from '~/components/fragments/text-generate-effect';

const DATA = [
  {
    icon: <AlertTriangleIcon className="size-5 shrink-0 text-red-600" />,
    title: 'Excel perdido, multa millonaria',
    description:
      'Un archivo Excel sobrescrito o perdido significa no poder demostrar cumplimiento. Sin historial de versiones ni trazabilidad, estás expuesto a sanciones de hasta €10M cuando la AEPD solicite evidencias.'
  },
  {
    icon: <ClockIcon className="size-5 shrink-0 text-orange-600" />,
    title: '72 horas que nadie conoce',
    description:
      'El reloj corre desde la detección, no desde cuando te enteras. Sin un sistema que registre el momento exacto y genere pruebas inmutables, es imposible demostrar que cumpliste el plazo legal.'
  },
  {
    icon: <BrainIcon className="size-5 shrink-0 text-purple-600" />,
    title: 'El conocimiento se va con las personas',
    description:
      'Cuando el responsable de IT se marcha, todo el conocimiento sobre incidentes pasados desaparece. Sin documentación centralizada y accesible, tu empresa queda vulnerable ante auditorías.'
  },
  {
    icon: <FileXIcon className="size-5 shrink-0 text-amber-600" />,
    title: 'Sin pruebas ante la AEPD',
    description:
      'Múltiples personas editando sin control, sin timestamps verificables, sin tokens de autenticidad. Cuando llegue la auditoría, no podrás probar cuándo detectaste vs. cuándo reportaste.'
  }
];

export function Problem(): React.JSX.Element {
  return (
    <GridSection id="problemas">
      <div className="px-4 py-12 sm:py-16 md:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
          <TextGenerateEffect words="4 riesgos que corres ahora mismo" />
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
          <span className="font-bold text-red-600">Cada día sin protección</span> es un riesgo de <span className="font-bold text-red-600">millones de euros</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-t border-dashed">
        {DATA.map((statement, index) => (
          <BlurFade
            key={index}
            inView
            delay={0.2 + index * 0.2}
            className="border-dashed px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 hover:bg-red-50/5 dark:hover:bg-red-950/10 transition-colors group"
          >
            <div className="mb-4 sm:mb-5 md:mb-7 flex size-10 sm:size-11 md:size-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 shadow dark:border-red-900 dark:bg-red-950/20 group-hover:scale-110 transition-transform">
              {statement.icon}
            </div>
            <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">{statement.title}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">{statement.description}</p>
          </BlurFade>
        ))}
      </div>
    </GridSection>
  );
}

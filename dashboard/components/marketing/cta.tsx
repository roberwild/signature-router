import * as React from 'react';
import Link from 'next/link';
import { AlertTriangleIcon, ClockIcon, ShieldCheckIcon } from 'lucide-react';

import { routes } from '@workspace/routes';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';

import { BlurFade } from '~/components/fragments/blur-fade';
import { GridSection } from '~/components/fragments/grid-section';
import { TextGenerateEffect } from '~/components/fragments/text-generate-effect';

export function CTA(): React.JSX.Element {
  return (
    <GridSection className="bg-diagonal-lines">
      <div className="container flex flex-col items-center justify-between gap-6 sm:gap-7 md:gap-8 bg-background px-4 py-12 sm:py-16 md:py-20 text-center">
        <BlurFade inView delay={0.2}>
          <Badge variant="destructive" className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1 text-xs sm:text-sm animate-pulse">
            <AlertTriangleIcon className="mr-1.5 sm:mr-2 size-3 sm:size-4" />
            <span className="hidden sm:inline">⚠️ El 87% de empresas no cumplen RGPD correctamente</span>
            <span className="sm:hidden">⚠️ 87% incumplen RGPD</span>
          </Badge>
        </BlurFade>
        
        <h3 className="m-0 max-w-2xl text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">
          <TextGenerateEffect words="¿Tu empresa está preparada para una auditoría mañana?" />
        </h3>
        
        <BlurFade inView delay={0.4}>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl px-2">
            Únete a <span className="font-bold text-foreground">+450 empresas</span> que ya protegen su negocio con tokens SHA256 inmutables
          </p>
        </BlurFade>

        <BlurFade inView delay={0.6} className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
          <div className="flex flex-col gap-3 sm:gap-4 items-center justify-center">
            <Link
              href={routes.dashboard.auth.SignUp}
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }), 
                'rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold shadow-xl transform hover:scale-105 transition-all px-6 sm:px-8 h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg w-full sm:w-auto max-w-sm'
              )}
            >
              <ShieldCheckIcon className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
              <span className="hidden sm:inline">Empezar Evaluación Gratuita</span>
              <span className="sm:hidden">Empieza Gratis</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs sm:text-sm text-muted-foreground">
              <ClockIcon className="size-3 sm:size-4" />
              <span className="hidden sm:inline">Sin tarjeta • 5 min setup • Cancela cuando quieras</span>
              <span className="sm:hidden">Sin tarjeta • Setup rápido</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl md:text-2xl">🇪🇺</span>
              <span className="font-medium">Servidores EU</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl md:text-2xl">🔒</span>
              <span className="font-medium">AES-256</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl md:text-2xl">✅</span>
              <span className="font-medium">ISO 27001</span>
            </div>
          </div>
        </BlurFade>
      </div>
    </GridSection>
  );
}

'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  FileBarChartIcon,
  ShieldCheckIcon,
  LockIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/components/badge';
import { buttonVariants } from '@workspace/ui/components/button';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import {
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@workspace/ui/components/tabs';
import { cn } from '@workspace/ui/lib/utils';

import { GridSection } from '~/components/fragments/grid-section';

function HeroPill(): React.JSX.Element {
  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: -20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex items-center justify-center"
    >
      <Link href="#servicios">
        <Badge
          variant="outline"
          className="group h-8 rounded-full px-3 text-xs font-medium shadow-sm duration-200 hover:bg-accent/50 sm:text-sm animate-pulse"
        >
          <div className="w-fit py-0.5 text-center text-xs text-red-500 font-bold sm:text-sm">
            🚨 RGPD Art. 33
          </div>
          <Separator
            orientation="vertical"
            className="mx-2"
          />
          Evita multas de hasta €10M
          <ChevronRightIcon className="ml-1.5 size-3 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5" />
        </Badge>
      </Link>
    </motion.div>
  );
}

function HeroTitle(): React.JSX.Element {
  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <h1 className="mt-6 text-center text-[48px] font-bold leading-[54px] tracking-[-1.2px] [font-kerning:none] sm:text-[56px] md:text-[64px] lg:text-[76px] lg:leading-[74px] lg:tracking-[-2px]">
        Protege tu empresa de
        <br /> 
        <span className="text-red-600">multas de €10M</span>
      </h1>
    </motion.div>
  );
}

function HeroDescription(): React.JSX.Element {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mx-auto mt-3 max-w-[680px] text-balance text-center text-lg leading-[26px] text-muted-foreground sm:text-xl lg:mt-6"
    >
      Los incidentes GDPR deben reportarse en <span className="font-semibold text-foreground">72 horas</span>. 
      Un solo error puede costar millones. Nuestro sistema de registro con tokens inmutables 
      te protege ante auditorías de la AEPD.
    </motion.p>
  );
}

function HeroButtons(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="mx-auto flex w-full flex-col gap-2 px-7 sm:w-auto sm:flex-row sm:px-0"
    >
      <Link
        href={routes.dashboard.auth.SignUp}
        className={cn(
          buttonVariants({
            variant: 'default'
          }),
          'h-12 rounded-xl px-8 text-base font-semibold sm:h-11 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg transform hover:scale-105 transition-all'
        )}
      >
        🚀 Evaluación Gratuita
      </Link>
      <Link
        href="#faq"
        className={cn(
          buttonVariants({
            variant: 'outline'
          }),
          'h-12 rounded-xl px-8 text-base sm:h-11'
        )}
      >
        Ver Demo
      </Link>
    </motion.div>
  );
}

function MainDashedGridLines(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <svg className="absolute left-[16.85%] top-0 hidden h-full w-px [mask-image:linear-gradient(to_bottom,#0000,#000_128px,#000_calc(100%-24px),#0000)] lg:block">
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100%"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
      <svg className="absolute right-[16.85%] top-0 hidden h-full w-px [mask-image:linear-gradient(to_bottom,#0000,#000_128px,#000_calc(100%-24px),#0000)] lg:block">
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100%"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
      <svg className="absolute bottom-[52px] left-[calc(50%-50vw)] hidden h-px w-screen [mask-image:linear-gradient(to_right,#0000,#000_100px,#000_calc(100%-100px),#0000)] lg:block">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
    </motion.div>
  );
}

function SupportiveDashedGridLines(): React.JSX.Element {
  return (
    <>
      <svg className="absolute left-[calc(50%-50vw)] top-[-25px] z-10 hidden h-px w-screen [mask-image:linear-gradient(to_right,#0000,#000_100px,#000_calc(100%-100px),#0000)] lg:block">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
      <svg className="absolute left-[calc(50%-50vw)] top-0 z-10 hidden h-px w-screen [mask-image:linear-gradient(to_right,#0000,#000_100px,#000_calc(100%-100px),#0000)] lg:block">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
      <svg className="absolute left-[calc(50%-50vw)] top-[52px] z-10 hidden h-px w-screen [mask-image:linear-gradient(to_right,#0000,#000_100px,#000_calc(100%-100px),#0000)] lg:block">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          stroke="hsl(var(--border))"
        />
      </svg>
    </>
  );
}

function HeroIllustration(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="relative mt-3 lg:mt-6"
    >
      <UnderlinedTabs defaultValue="feature5">
        <ScrollArea className="max-w-[100vw] lg:max-w-none">
          <UnderlinedTabsList className="relative z-20 mb-6 flex h-fit flex-row flex-wrap justify-center md:flex-nowrap">
            <UnderlinedTabsTrigger
              value="feature5"
              className="mx-1 px-2.5 sm:mx-2 sm:px-3"
            >
              <FileBarChartIcon className="mr-2 size-4 shrink-0" />
              Evaluación Cyber
            </UnderlinedTabsTrigger>
            <UnderlinedTabsTrigger
              value="feature4"
              className="mx-1 px-2.5 sm:mx-2 sm:px-3"
            >
              <ClockIcon className="mr-2 size-4 shrink-0" />
              Registro de Incidentes
            </UnderlinedTabsTrigger>
            <UnderlinedTabsTrigger
              value="feature1"
              className="mx-1 px-2.5 sm:mx-2 sm:px-3"
            >
              <ShieldCheckIcon className="mr-2 size-4 shrink-0" />
              Token Inmutable
            </UnderlinedTabsTrigger>
            <UnderlinedTabsTrigger
              value="feature2"
              className="mx-1 px-2.5 sm:mx-2 sm:px-3"
            >
              <LockIcon className="mr-2 size-4 shrink-0" />
              Portal Verificación
            </UnderlinedTabsTrigger>
            <UnderlinedTabsTrigger
              value="feature3"
              className="mx-1 px-2.5 sm:mx-2 sm:px-3"
            >
              <FileTextIcon className="mr-2 size-4 shrink-0" />
              Registro AEPD
            </UnderlinedTabsTrigger>
          </UnderlinedTabsList>
          <ScrollBar
            orientation="horizontal"
            className="invisible"
          />
        </ScrollArea>
        <div className="relative mb-1 w-full rounded-xl dark:border-none dark:bg-background">
          <SupportiveDashedGridLines />
          <div className="relative z-20 bg-background">
            <UnderlinedTabsContent value="feature1">
              <Image
                priority
                quality={100}
                src="/assets/hero/light-feature1.webp"
                width="1328"
                height="727"
                alt="Feature 1 screenshot"
                className="rounded-xl border shadow"
                unoptimized
              />
            </UnderlinedTabsContent>
            <UnderlinedTabsContent value="feature2">
              <Image
                quality={100}
                src="/assets/hero/light-feature2.webp"
                width="1328"
                height="727"
                alt="Feature 2 screenshot"
                className="rounded-xl border shadow"
                unoptimized
              />
            </UnderlinedTabsContent>
            <UnderlinedTabsContent value="feature3">
              <Image
                quality={100}
                src="/assets/hero/light-feature3.webp"
                width="1328"
                height="727"
                alt="Feature 3 screenshot"
                className="rounded-xl border shadow"
                unoptimized
              />
            </UnderlinedTabsContent>
            <UnderlinedTabsContent value="feature4">
              <Image
                quality={100}
                src="/assets/hero/light-feature4.webp"
                width="1328"
                height="727"
                alt="Feature 4 screenshot"
                className="rounded-xl border shadow"
                unoptimized
              />
            </UnderlinedTabsContent>
            <UnderlinedTabsContent value="feature5">
              <Image
                quality={100}
                src="/assets/hero/light-feature5.webp"
                width="1328"
                height="727"
                alt="Feature 5 screenshot"
                className="rounded-xl border shadow"
                unoptimized
              />
            </UnderlinedTabsContent>
          </div>
        </div>
      </UnderlinedTabs>
    </motion.div>
  );
}

function TrustBadges(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="mx-auto flex flex-wrap items-center justify-center gap-6 mt-8"
    >
      <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full">
        <CheckCircleIcon className="size-5 text-green-600" />
        <span className="font-medium">Cumple RGPD Art. 33</span>
      </div>
      <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full">
        <ShieldCheckIcon className="size-5 text-blue-600" />
        <span className="font-medium">Verificado AEPD</span>
      </div>
      <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-full">
        <LockIcon className="size-5 text-purple-600" />
        <span className="font-medium">ISO 27001</span>
      </div>
    </motion.div>
  );
}

export function Hero(): React.JSX.Element {
  return (
    <GridSection className="overflow-x-hidden">
      <MainDashedGridLines />
      <div className="mx-auto mt-16 flex flex-col gap-6 px-2 sm:mt-20 sm:px-1 md:mt-24 lg:mt-32">
        <div className="gap-2">
          <HeroPill />
          <HeroTitle />
        </div>
        <HeroDescription />
        <HeroButtons />
        <TrustBadges />
        <HeroIllustration />
      </div>
    </GridSection>
  );
}

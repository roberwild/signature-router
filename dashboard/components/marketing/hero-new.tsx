'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ClockIcon,
  LockIcon,
  FileTextIcon,
  FileBarChartIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SparklesIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@workspace/ui/components/tabs';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/scroll-area';

export function Hero(): React.JSX.Element {
  const [timeLeft, setTimeLeft] = React.useState(72);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 0.01 : 72));
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-yellow-50/20 dark:to-yellow-950/10">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-red-500/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-10 md:py-20 max-w-full overflow-hidden">
        {/* Emergency Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6 md:mb-8"
        >
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-30 animate-pulse" />
            <Badge 
              variant="destructive" 
              className="relative px-3 md:px-6 py-2 text-xs md:text-sm font-bold shadow-2xl border-2 border-red-600 bg-red-500/90 animate-pulse w-full flex items-center justify-center"
            >
              <AlertTriangleIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-bounce flex-shrink-0" />
              <span className="text-center">La AEPD impuso €35M en multas</span>
              <AlertTriangleIcon className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 animate-bounce flex-shrink-0" />
            </Badge>
          </div>
        </motion.div>

        {/* Main Title with Impact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight">
            <span className="block bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Tu Empresa Tiene
            </span>
            <div className="relative inline-block mt-2">
              <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-red-600 animate-pulse block">
                {timeLeft.toFixed(0)} HORAS
              </span>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-6 md:-right-6 lg:-top-8 lg:-right-8"
              >
                <ClockIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 text-yellow-500" />
              </motion.div>
            </div>
            <span className="block text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-gray-700 dark:text-gray-300 mt-2">
              Para Reportar un Incidente GDPR
            </span>
          </h1>
        </motion.div>

        {/* Subtitle with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8 md:mb-12 space-y-4 px-2"
        >
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Sin un sistema de registro inmutable, <span className="font-bold text-red-600">no podrás probar</span> el cumplimiento ante la AEPD
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2 bg-red-100 dark:bg-red-950/30 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full">
              <span className="text-base sm:text-xl md:text-2xl">⚖️</span>
              <span className="font-bold">Multas €10M</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-orange-100 dark:bg-orange-950/30 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full">
              <span className="text-base sm:text-xl md:text-2xl">📊</span>
              <span className="font-bold">87% Incumplen</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 dark:bg-yellow-950/30 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full">
              <span className="text-base sm:text-xl md:text-2xl">🔍</span>
              <span className="font-bold">2.5K Auditorías</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons with Urgency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-4 justify-center items-center mb-8 md:mb-12 px-2"
        >
          <Link href={routes.dashboard.auth.SignUp} className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="relative group h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-2xl transform hover:scale-105 transition-all overflow-visible w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center">
                <SparklesIcon className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Protege Tu Empresa AHORA</span>
                <span className="sm:hidden">Empieza GRATIS</span>
                <ArrowRightIcon className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute -inset-1 rounded-lg bg-yellow-500/50 blur-xl opacity-70 group-hover:opacity-100 transition-opacity animate-pulse -z-10" />
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle2Icon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span>Sin tarjeta</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span>5 min setup</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-bold text-green-600">GRATIS</span>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mb-8 md:mb-16 px-2"
        >
          <div className="flex items-center gap-1 sm:gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm">
            <span className="text-base sm:text-xl md:text-2xl">🏛️</span>
            <span className="font-medium">AEPD</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm">
            <span className="text-base sm:text-xl md:text-2xl">🔐</span>
            <span className="font-medium">SHA256</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm">
            <span className="text-base sm:text-xl md:text-2xl">🇪🇺</span>
            <span className="font-medium">RGPD</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm">
            <span className="text-base sm:text-xl md:text-2xl">☁️</span>
            <span className="font-medium">Cloud EU</span>
          </div>
        </motion.div>

        {/* Interactive Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="max-w-6xl mx-auto px-2 sm:px-4 md:px-0"
        >
          <UnderlinedTabs defaultValue="feature5" className="w-full overflow-x-hidden">
            <ScrollArea className="w-full overflow-x-auto">
              <UnderlinedTabsList className="relative z-20 mb-6 flex h-fit flex-row flex-nowrap justify-start sm:justify-center md:justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-full p-1 min-w-fit">
                <UnderlinedTabsTrigger value="feature5" className="mx-1 px-4 sm:px-6">
                  <FileBarChartIcon className="mr-2 size-4 shrink-0" />
                  Evaluación Cyber
                </UnderlinedTabsTrigger>
                <UnderlinedTabsTrigger value="feature4" className="mx-1 px-4 sm:px-6">
                  <ClockIcon className="mr-2 size-4 shrink-0" />
                  Registro 72h
                </UnderlinedTabsTrigger>
                <UnderlinedTabsTrigger value="feature1" className="mx-1 px-4 sm:px-6">
                  <ShieldCheckIcon className="mr-2 size-4 shrink-0" />
                  Token Inmutable
                </UnderlinedTabsTrigger>
                <UnderlinedTabsTrigger value="feature2" className="mx-1 px-4 sm:px-6">
                  <LockIcon className="mr-2 size-4 shrink-0" />
                  Portal Verificación
                </UnderlinedTabsTrigger>
                <UnderlinedTabsTrigger value="feature3" className="mx-1 px-4 sm:px-6">
                  <FileTextIcon className="mr-2 size-4 shrink-0" />
                  Registro AEPD
                </UnderlinedTabsTrigger>
              </UnderlinedTabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
            
            <div className="relative rounded-2xl border-4 border-yellow-500/20 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />
              <UnderlinedTabsContent value="feature5">
                <Image
                  quality={100}
                  src="/assets/hero/light-feature5.webp"
                  width="1328"
                  height="727"
                  alt="Evaluación Cyber screenshot"
                  className="rounded-lg"
                  unoptimized
                />
              </UnderlinedTabsContent>
              <UnderlinedTabsContent value="feature4">
                <Image
                  quality={100}
                  src="/assets/hero/light-feature4.webp"
                  width="1328"
                  height="727"
                  alt="Registro 72h screenshot"
                  className="rounded-lg"
                  unoptimized
                />
              </UnderlinedTabsContent>
              <UnderlinedTabsContent value="feature1">
                <Image
                  quality={100}
                  src="/assets/hero/light-feature1.webp"
                  width="1328"
                  height="727"
                  alt="Token Inmutable screenshot"
                  className="rounded-lg"
                  unoptimized
                />
              </UnderlinedTabsContent>
              <UnderlinedTabsContent value="feature2">
                <Image
                  quality={100}
                  src="/assets/hero/light-feature2.webp"
                  width="1328"
                  height="727"
                  alt="Portal Verificación screenshot"
                  className="rounded-lg"
                  unoptimized
                />
              </UnderlinedTabsContent>
              <UnderlinedTabsContent value="feature3">
                <Image
                  quality={100}
                  src="/assets/hero/light-feature3.webp"
                  width="1328"
                  height="727"
                  alt="Registro AEPD screenshot"
                  className="rounded-lg"
                  unoptimized
                />
              </UnderlinedTabsContent>
            </div>
          </UnderlinedTabs>
        </motion.div>
      </div>
    </section>
  );
}
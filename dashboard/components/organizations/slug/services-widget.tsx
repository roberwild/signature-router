'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

interface ServicesWidgetProps {
  organizationSlug: string;
}

export function ServicesWidget({ organizationSlug }: ServicesWidgetProps) {
  // Temporarily disabled - remove this return statement to re-enable the widget
  return null;
  
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if we're on the incidents new page - don't show widget there
    if (pathname.includes('/incidents/new')) {
      return;
    }

    // Check if user has already interacted with widget in this session
    const interacted = sessionStorage.getItem('services-widget-interacted');
    if (interacted) {
      setHasInteracted(true);
      return;
    }

    // Show widget after 5 seconds on page
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClose = () => {
    setIsVisible(false);
    setHasInteracted(true);
    sessionStorage.setItem('services-widget-interacted', 'true');
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show the widget or button on incidents new page
  if (pathname.includes('/incidents/new')) {
    return null;
  }

  if (!isVisible || hasInteracted) {
    // Show Minery logo as floating button for premium services
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <a 
          href={`/organizations/${organizationSlug}/services`}
          className="group relative block"
        >
          {/* Pulse animation rings */}
          <div className="absolute -inset-1 rounded-full bg-primary/40 animate-pulse [animation-duration:2s]" />
          <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse [animation-duration:2s] [animation-delay:0.5s]" />
          
          {/* Logo button */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 ring-2 ring-white dark:ring-gray-800">
            <img 
              src="/apple-touch-icon.png" 
              alt="Minery Premium Services" 
              className="h-10 w-10 rounded-full"
            />
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5 shadow-lg">
              <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-white dark:text-gray-900">
                <Sparkles className="h-3.5 w-3.5" />
                Servicios Premium
              </div>
              <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          variant="default"
          className="shadow-lg hover:shadow-xl transition-all"
          onClick={handleMinimize}
        >
          <Shield className="mr-2 h-5 w-5" />
          Ver Servicios Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur">
        <div className="relative">
          {/* Close and Minimize buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleMinimize}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Widget Header */}
          <div className="p-4 pt-8 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">¿Necesitas más protección?</h3>
              <Badge variant="default" className="text-xs">-20%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Servicios profesionales de ciberseguridad adaptados a tu organización
            </p>
          </div>

          <CardContent className="p-4 pt-2 space-y-2">
            {/* Service recommendations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <Shield className="h-3 w-3 text-primary" />
                <span>Análisis de Madurez Profesional</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <Shield className="h-3 w-3 text-primary" />
                <span>Pentest - Pruebas de Penetración</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <Shield className="h-3 w-3 text-primary" />
                <span>CISO Virtual para tu empresa</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 space-y-2">
              <Button 
                size="sm" 
                asChild
              >
                <a href={`/organizations/${organizationSlug}/services`} className="w-full">
                  Ver Todos los Servicios
                  <ChevronRight className="ml-1 h-3 w-3" />
                </a>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                asChild
                className="w-full"
              >
                <a href="https://wa.me/message/C35F4AFPXDNUK1" target="_blank" rel="noopener noreferrer">
                  <svg 
                    className="mr-1.5 h-3.5 w-3.5" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
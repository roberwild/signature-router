'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  FileWarning, 
  ClipboardCheck, 
  Shield, 
  FileText,
  Download,
  Settings,
  HelpCircle,
  ExternalLink,
  BookOpen,
  Bell
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';

interface QuickActionsCardProps {
  organizationSlug: string;
}

interface ActionItem {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant?: 'default' | 'secondary';
  disabled?: boolean;
  external?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function QuickActionsCard({ organizationSlug }: QuickActionsCardProps) {
  const params = useParams();
  const locale = params.locale as string;
  
  const primaryActions: ActionItem[] = [
    {
      title: 'Registrar Incidente',
      description: 'Notificar nueva brecha de seguridad',
      icon: FileWarning,
      href: `/${locale}/organizations/${organizationSlug}/incidents/new`,
      variant: 'default' as const,
    },
    {
      title: 'Test de Ciberseguridad',
      description: 'Descubre si estás preparado en 5 minutos',
      icon: ClipboardCheck,
      href: `/${locale}/organizations/${organizationSlug}/assessments/new`,
      variant: 'secondary' as const,
    },
  ];

  const secondaryActions: ActionItem[] = [
    {
      title: 'Ver Registro',
      icon: FileText,
      href: `/${locale}/organizations/${organizationSlug}/incidents`,
    },
    {
      title: 'Exportar Datos',
      icon: Download,
      href: '#',
      disabled: true,
    },
    {
      title: 'Configuración',
      icon: Settings,
      href: `/${locale}/organizations/${organizationSlug}/settings`,
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      href: `/${locale}/organizations/${organizationSlug}/settings/account/notifications`,
    },
  ];

  const resources: ActionItem[] = [
    {
      title: 'Guía RGPD Art. 33',
      icon: BookOpen,
      href: 'https://www.aepd.es/es/documento/guia-brechas-seguridad.pdf',
      external: true,
    },
    {
      title: 'Centro de Ayuda',
      icon: HelpCircle,
      href: '/help',
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Acciones Rápidas</CardTitle>
        </div>
        <CardDescription>
          Accede a las funciones más importantes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          {primaryActions.map((action) => (
            <Link key={action.title} href={action.href} className="block">
              <Button 
                variant={action.variant} 
                className={`w-full justify-start p-4 h-auto ${
                  action.title === 'Registrar Incidente' 
                    ? '[&>div>div>span]:!text-gray-900 [&>div>p]:!text-gray-800' 
                    : ''
                }`}
              >
                <action.icon className="mr-3 h-5 w-5 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{action.title}</span>
                    {action.badge && (
                      <Badge variant={action.badgeVariant} className="text-xs shrink-0">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs leading-tight font-medium">
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        <Separator />

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-2 gap-2">
          {secondaryActions.map((action) => (
            <Link 
              key={action.title} 
              href={action.disabled ? '#' : action.href}
              className={action.disabled ? 'pointer-events-none opacity-50' : ''}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="w-full justify-start"
                disabled={action.disabled}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span className="text-xs">{action.title}</span>
              </Button>
            </Link>
          ))}
        </div>

        <Separator />

        {/* Resources */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Recursos</p>
          {resources.map((resource) => (
            <Link 
              key={resource.title}
              href={resource.href}
              target={resource.external ? '_blank' : undefined}
              rel={resource.external ? 'noopener noreferrer' : undefined}
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <resource.icon className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">{resource.title}</span>
                {resource.external && (
                  <ExternalLink className="h-3 w-3 opacity-50" />
                )}
              </Button>
            </Link>
          ))}
        </div>

        {/* Premium Upsell */}
        <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs font-medium mb-1">🚀 Funciones Premium</p>
          <p className="text-xs text-muted-foreground mb-2">
            Desbloquea análisis avanzados y automatización
          </p>
          <Button size="sm" variant="outline" className="w-full">
            Ver planes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface AlertsSectionProps {
  organizationId: string;
  organizationSlug: string;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
}

export function AlertsSection({ organizationId, organizationSlug }: AlertsSectionProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Fetch real alerts based on organization status
    const mockAlerts: AlertItem[] = [];

    // Check for critical incidents
    mockAlerts.push({
      id: 'incident-72h',
      type: 'error',
      title: '⚠️ Incidente sin notificar',
      description: 'Tienes un incidente crítico pendiente de notificar a la AEPD. Plazo: 48 horas restantes.',
      action: {
        label: 'Notificar ahora',
        href: `/organizations/${organizationSlug}/incidents/1/notify`,
      },
      dismissible: false,
    });

    // Check for upcoming assessments
    const lastAssessmentDate = new Date('2024-01-15');
    const daysSinceAssessment = Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceAssessment > 60) {
      mockAlerts.push({
        id: 'assessment-due',
        type: 'warning',
        title: 'Evaluación pendiente',
        description: `Han pasado ${daysSinceAssessment} días desde tu última evaluación. Se recomienda realizar una nueva evaluación trimestral.`,
        action: {
          label: 'Iniciar evaluación',
          href: `/organizations/${organizationSlug}/assessments/new`,
        },
        dismissible: true,
      });
    }

    // Check for incomplete compliance
    mockAlerts.push({
      id: 'compliance-incomplete',
      type: 'info',
      title: 'Mejora tu cumplimiento',
      description: 'Completa la designación del DPO y el plan de respuesta para alcanzar el 100% de cumplimiento.',
      action: {
        label: 'Ver requisitos',
        href: `/organizations/${organizationSlug}/compliance`,
      },
      dismissible: true,
    });

    setAlerts(mockAlerts.filter(alert => !dismissedAlerts.includes(alert.id)));
  }, [organizationId, organizationSlug, dismissedAlerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'success':
        return CheckCircle;
    }
  };

  const getAlertStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-500/50 bg-red-500/10 [&>svg]:text-red-500';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10 [&>svg]:text-yellow-500';
      case 'info':
        return 'border-blue-500/50 bg-blue-500/10 [&>svg]:text-blue-500';
      case 'success':
        return 'border-green-500/50 bg-green-500/10 [&>svg]:text-green-500';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.type);
        return (
          <Alert
            key={alert.id}
            className={cn(
              "relative",
              getAlertStyles(alert.type)
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <AlertTitle className="pr-8">{alert.title}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              <div className="flex items-center justify-between gap-4">
                <span>{alert.description}</span>
                {alert.action && (
                  <Link href={alert.action.href}>
                    <Button
                      size="sm"
                      variant={alert.type === 'error' ? 'destructive' : 'default'}
                      className="shrink-0"
                    >
                      {alert.action.label}
                    </Button>
                  </Link>
                )}
              </div>
            </AlertDescription>
            {alert.dismissible && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            )}
          </Alert>
        );
      })}
    </div>
  );
}
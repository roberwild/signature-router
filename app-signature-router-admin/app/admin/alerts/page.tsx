'use client';

import { Bell, AlertTriangle, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Alertas</h1>
                <p className="text-sm text-muted-foreground">
                  Notificaciones y alertas del sistema
                </p>
              </div>
            </div>
            <Button variant="outline">
              Marcar todas como leídas
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl space-y-6 p-6">

      {/* Alerts Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Críticas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Advertencias
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              Para revisar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Informativas
            </CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground mt-1">
              Información general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resueltas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Recientes</CardTitle>
          <CardDescription>
            Últimas notificaciones del sistema ordenadas por prioridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Alert 1 - Critical */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Provider Twilio SMS caído</h4>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  El provider Twilio SMS no está respondiendo. 15 firmas pendientes afectadas.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 5 minutos
                  </span>
                  <Button variant="destructive" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 2 - Critical */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Tasa de error elevada</h4>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  La tasa de error de validación de firmas ha superado el 10% en la última hora.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 12 minutos
                  </span>
                  <Button variant="destructive" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 3 - Critical */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Timeout en base de datos</h4>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Múltiples queries a PostgreSQL están excediendo el timeout de 5 segundos.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 25 minutos
                  </span>
                  <Button variant="destructive" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 4 - Warning */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Latencia elevada en Provider PUSH</h4>
                  <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">Advertencia</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Firebase FCM está respondiendo más lento de lo habitual (P95: 2.5s vs 800ms normal).
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 1 hora
                  </span>
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 5 - Info */}
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Actualización de sistema programada</h4>
                  <Badge variant="outline">Informativa</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mantenimiento programado para el próximo domingo 3:00-5:00 AM. Downtime estimado: 2 horas.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 2 horas
                  </span>
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 6 - Success */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Provider Twilio SMS restaurado</h4>
                  <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">Resuelto</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  El servicio ha sido restaurado automáticamente. Todas las firmas pendientes han sido procesadas.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace 3 horas
                  </span>
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Notice */}
      <Card className="border-dashed border-2 bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Página en Desarrollo</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Esta es una versión preliminar de la página de Alertas. 
              Las funcionalidades completas (filtros, configuración de notificaciones, etc.) se implementarán en la siguiente iteración.
            </p>
            <Badge variant="secondary" className="mt-2">Epic 6 - Pendiente de Integración</Badge>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


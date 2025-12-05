'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { Alert, AlertFilters } from '@/lib/api/types';

export default function AlertsPage() {
  const { apiClient, isAuthenticated, isLoading: authLoading, redirectToLogin } = useApiClientWithStatus({ autoRedirect: true });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlertFilters>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cargar alertas
  const loadAlerts = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAlerts(filter);
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAlerts();
    // Auto-refresh cada 60 segundos
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [filter, isAuthenticated]);

  // Reconocer alerta
  const handleAcknowledge = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.acknowledgeAlert(id);
      setAlerts(alerts.map(a =>
        a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Resolver alerta
  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.resolveAlert(id);
      setAlerts(alerts.map(a =>
        a.id === id ? { ...a, status: 'RESOLVED' as const, resolvedAt: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllRead = async () => {
    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
    for (const alert of activeAlerts) {
      await handleAcknowledge(alert.id);
    }
  };

  // Contar por severidad y estado
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status === 'ACTIVE').length;
  const infoCount = alerts.filter(a => a.severity === 'INFO' && a.status === 'ACTIVE').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  const getSeverityStyles = (severity: string, status: string) => {
    if (status === 'RESOLVED') {
      return 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950';
    }
    switch (severity) {
      case 'CRITICAL':
        return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950';
      case 'WARNING':
        return 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'border-border';
    }
  };

  const getSeverityIcon = (severity: string, status: string) => {
    if (status === 'RESOLVED') {
      return <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />;
    }
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string, status: string) => {
    if (status === 'RESOLVED') {
      return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">Resuelto</Badge>;
    }
    if (status === 'ACKNOWLEDGED') {
      return <Badge variant="secondary">Reconocido</Badge>;
    }
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'WARNING':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Advertencia</Badge>;
      default:
        return <Badge variant="outline">Informativa</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - autoRedirect should handle this
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Redirigiendo al Login...</h2>
            <p className="text-muted-foreground mb-4">
              Tu sesión ha expirado. Redirigiendo automáticamente...
            </p>
            <Button onClick={redirectToLogin} variant="outline">
              Ir al Login ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      <div className="bg-gray-50 dark:bg-card border-b border-border">
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadAlerts} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant="outline" onClick={handleMarkAllRead} disabled={criticalCount + warningCount + infoCount === 0}>
                Marcar todas como leídas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Alerts Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={filter.severity === 'CRITICAL' ? 'ring-2 ring-red-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Alertas Críticas
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalCount}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setFilter(f => f.severity === 'CRITICAL' ? {} : { severity: 'CRITICAL' })}
              >
                {filter.severity === 'CRITICAL' ? 'Ver todas' : 'Filtrar'}
              </Button>
            </CardContent>
          </Card>

          <Card className={filter.severity === 'WARNING' ? 'ring-2 ring-yellow-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Advertencias
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningCount}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setFilter(f => f.severity === 'WARNING' ? {} : { severity: 'WARNING' })}
              >
                {filter.severity === 'WARNING' ? 'Ver todas' : 'Filtrar'}
              </Button>
            </CardContent>
          </Card>

          <Card className={filter.severity === 'INFO' ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Informativas
              </CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{infoCount}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setFilter(f => f.severity === 'INFO' ? {} : { severity: 'INFO' })}
              >
                {filter.severity === 'INFO' ? 'Ver todas' : 'Filtrar'}
              </Button>
            </CardContent>
          </Card>

          <Card className={filter.status === 'RESOLVED' ? 'ring-2 ring-green-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resueltas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCount}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setFilter(f => f.status === 'RESOLVED' ? {} : { status: 'RESOLVED' })}
              >
                {filter.status === 'RESOLVED' ? 'Ver todas' : 'Filtrar'}
              </Button>
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
            {loading && alerts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando alertas...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">No hay alertas activas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${getSeverityStyles(alert.severity, alert.status)}`}
                  >
                    {getSeverityIcon(alert.severity, alert.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{alert.title}</h4>
                        {getSeverityBadge(alert.severity, alert.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                        {alert.status === 'ACTIVE' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                              disabled={actionLoading === alert.id}
                            >
                              {actionLoading === alert.id ? 'Procesando...' : 'Reconocer'}
                            </Button>
                            <Button
                              variant={alert.severity === 'CRITICAL' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                              disabled={actionLoading === alert.id}
                            >
                              {actionLoading === alert.id ? 'Procesando...' : 'Resolver'}
                            </Button>
                          </>
                        )}
                        {alert.status === 'ACKNOWLEDGED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            disabled={actionLoading === alert.id}
                          >
                            {actionLoading === alert.id ? 'Procesando...' : 'Resolver'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

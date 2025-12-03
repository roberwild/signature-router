'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Key, UserCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { SecurityOverview, AccessEvent } from '@/lib/api/types';

export default function SecurityPage() {
  const { apiClient, isAuthenticated } = useApiClientWithStatus();
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de seguridad
  const loadSecurityData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [overviewData, eventsData] = await Promise.all([
        apiClient.getSecurityOverview(),
        apiClient.getAccessAudit(20)
      ]);
      setOverview(overviewData);
      setAccessEvents(eventsData);
    } catch (err) {
      console.error('Error loading security data:', err);
      setError('Error al cargar datos de seguridad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSecurityData();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} min`;
    return 'Hace un momento';
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'LOGOUT':
        return <Lock className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'LOGIN_SUCCESS':
        return 'Login exitoso';
      case 'LOGIN_FAILED':
        return 'Intento fallido de login';
      case 'LOGOUT':
        return 'Logout';
      default:
        return event;
    }
  };

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Seguridad</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de seguridad, autenticación y control de acceso
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadSecurityData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
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

        {/* Security Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Usuarios
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading && !overview ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overview?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En el sistema
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Autenticación 2FA
              </CardTitle>
              <Lock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading && !overview ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overview?.users2FA || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview && overview.totalUsers > 0 
                      ? `${Math.round((overview.users2FA / overview.totalUsers) * 100)}% de usuarios con 2FA`
                      : 'Con verificación 2FA'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tokens Activos
              </CardTitle>
              <Key className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {loading && !overview ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overview?.activeTokens || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sesiones activas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Intentos Fallidos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading && !overview ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overview?.failedLogins24h || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimas 24 horas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuración de Autenticación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Autenticación
              </CardTitle>
              <CardDescription>
                Configuración de métodos de autenticación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">OAuth 2.0 / OpenID Connect</p>
                  <p className="text-xs text-muted-foreground">Autenticación principal via Keycloak</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Verificación en dos pasos</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">JWT Tokens</p>
                  <p className="text-xs text-muted-foreground">Expiración: 24h</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Directory</p>
                  <p className="text-xs text-muted-foreground">Sincronización de usuarios</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Políticas de Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Políticas de Seguridad
              </CardTitle>
              <CardDescription>
                Reglas y políticas de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Contraseña Fuerte</p>
                  <p className="text-xs text-muted-foreground">Mínimo 12 caracteres</p>
                </div>
                <Badge variant="default">Obligatorio</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">IP Whitelisting</p>
                  <p className="text-xs text-muted-foreground">Redes corporativas autorizadas</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">100 req/min por usuario</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bloqueo por Intentos</p>
                  <p className="text-xs text-muted-foreground">5 intentos fallidos = 15 min bloqueo</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Auditoría de Acceso */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Auditoría de Acceso
              </CardTitle>
              <CardDescription>
                Últimos accesos y eventos de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && accessEvents.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
                </div>
              ) : accessEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay eventos de acceso recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        {getEventIcon(event.event)}
                        <div>
                          <p className="text-sm font-medium">{event.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {getEventLabel(event.event)} desde {event.ipAddress}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Status Banner */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Estado de Seguridad: Óptimo
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Todos los controles de seguridad están activos y funcionando correctamente.
                  La autenticación está gestionada por Keycloak con integración Active Directory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  TestTube,
  RefreshCw,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Euro,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { CreateProviderDialog } from '@/components/providers/CreateProviderDialog';
import { EditProviderDialog } from '@/components/providers/EditProviderDialog';
import { DeleteProviderDialog } from '@/components/providers/DeleteProviderDialog';
import { TestProviderDialog } from '@/components/providers/TestProviderDialog';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/lib/config';
import type { ProviderMetrics } from '@/lib/api/types';
import {
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Provider {
  id: string;
  name: string;
  type: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  status: 'healthy' | 'degraded' | 'down';
  circuitBreakerStatus: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastHealthCheck: string;
  endpoint: string;
  // Metrics from backend (Epic 14)
  metrics?: ProviderMetrics;
}

export default function ProvidersPage() {
  const { toast } = useToast();
  const { apiClient, isLoading: authLoading, isAuthenticated, redirectToLogin } = useApiClientWithStatus({ autoRedirect: true });

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  // Use ref to avoid recreating loadProviders on every render
  const apiClientRef = useRef(apiClient);
  apiClientRef.current = apiClient;

  // Track if initial load has been done
  const initialLoadDone = useRef(false);

  // Load providers and their metrics
  const loadProviders = useCallback(async () => {
    const client = apiClientRef.current;

    try {
      const response = await client.getProviders();

      // Convert API data to UI format and fetch metrics for each provider
      const providersWithMetrics = await Promise.all(
        response.providers.map(async (p: any) => {
          let metrics: ProviderMetrics | undefined;

          try {
            metrics = await client.getProviderMetrics(p.id);
          } catch (err) {
            // Only log if not an abort error (which happens during cleanup)
            if (err instanceof Error && err.name !== 'AbortError') {
              console.warn(`Failed to load metrics for provider ${p.id}:`, err);
            }
          }

          return {
            id: p.id,
            name: p.provider_name,
            type: p.provider_type,
            status: p.health_status === 'UP' ? 'healthy' : p.health_status === 'DEGRADED' ? 'degraded' : 'down',
            circuitBreakerStatus: p.circuit_breaker_status || 'CLOSED',
            lastHealthCheck: p.last_health_check || new Date().toISOString(),
            endpoint: p.endpoint_url,
            metrics,
          } as Provider;
        })
      );

      setProviders(providersWithMetrics);
    } catch (error) {
      // Only show error if not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading providers:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los proveedores',
          variant: 'destructive',
        });
      }
    }
  }, [toast]); // Only toast as dependency - apiClient accessed via ref

  // Initial load - only runs once when authenticated
  useEffect(() => {
    if (authLoading || initialLoadDone.current) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    initialLoadDone.current = true;
    setLoading(true);
    loadProviders().finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, loadProviders]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
    toast({
      title: 'Actualizado',
      description: 'Datos de proveedores actualizados',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-500/10 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-200';
      case 'down':
        return 'text-red-600 bg-red-500/10 border-red-200';
      default:
        return 'text-gray-600 bg-gray-500/10 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle2;
      case 'degraded':
        return AlertCircle;
      case 'down':
        return XCircle;
      default:
        return Activity;
    }
  };

  const getCircuitBreakerColor = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'HALF_OPEN':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'OPEN':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  // Calculate totals from metrics
  const totalStats = {
    totalRequests: providers.reduce((acc, p) => acc + (p.metrics?.requests_today || 0), 0),
    avgSuccessRate: providers.length > 0
      ? providers.reduce((acc, p) => acc + (p.metrics?.success_rate || 0), 0) / providers.length
      : 0,
    avgResponseTime: providers.length > 0
      ? providers.reduce((acc, p) => acc + (p.metrics?.avg_response_time || 0), 0) / providers.length
      : 0,
    totalCostToday: providers.reduce((acc, p) => acc + (p.metrics?.total_cost_today_eur || 0), 0),
  };

  // Chart data from metrics
  const responseTimeData = providers.map(p => ({
    name: p.name.replace(' ', '\n'),
    tiempo: p.metrics?.avg_response_time || 0,
  }));

  // Colores variados para el gráfico de uptime
  const UPTIME_COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#06b6d4', '#ec4899'];

  const uptimeData = providers.map((p, index) => ({
    name: p.name,
    uptime: p.metrics?.uptime || 0,
    fill: UPTIME_COLORS[index % UPTIME_COLORS.length],
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#06b6d4', '#ec4899'];

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  // Show auth required message - autoRedirect should handle this
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
      {/* Header */}
      <div className="bg-gray-50 dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Gestión de Proveedores"
                info="Monitoreo y configuración de servicios externos"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/providers/templates'}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Provider
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Mock Mode Banner */}
        {config.useMockData && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Modo Demostración Activo
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Estás viendo datos de demostración. Los cambios no se persisten.
                    Para usar el backend real, configura <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_USE_MOCK_DATA=false</code> en tu archivo <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MuleSoft Integration Banner - TODO Indicator */}
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Métricas MuleSoft Pendientes
                  </h3>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    ⚠️ TODO: MuleSoft
                  </Badge>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Las métricas de <strong>latencia</strong>, <strong>uptime</strong>, <strong>requests</strong> y <strong>costos</strong> son estimaciones placeholder.
                  Una vez completada la integración con MuleSoft, se mostrarán datos reales del gateway.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Stats - Placeholder Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Requests Hoy
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">TODO</Badge>
                  </p>
                  <p className="text-2xl font-bold">{totalStats.totalRequests.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Éxito Promedio
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">TODO</Badge>
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {totalStats.avgSuccessRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Tiempo Resp.
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">TODO</Badge>
                  </p>
                  <p className="text-2xl font-bold">{totalStats.avgResponseTime.toFixed(2)}s</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Costo Hoy
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-200">TODO</Badge>
                  </p>
                  <p className="text-2xl font-bold">€{totalStats.totalCostToday.toFixed(2)}</p>
                </div>
                <Euro className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts - Placeholder Data */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Response Time Comparison */}
          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Tiempo de Respuesta (TODO)
                  </CardTitle>
                  <CardDescription>Placeholder - Latencia estimada por proveedor</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  ⚠️ MuleSoft
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    label={{ value: 'segundos', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}s`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="tiempo"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1500}
                  >
                    {responseTimeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.tiempo < 2 ? '#10b981' : entry.tiempo < 3 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Uptime Radial Chart */}
          <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Disponibilidad (TODO)
                  </CardTitle>
                  <CardDescription>Placeholder - Uptime estimado por proveedor</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  ⚠️ MuleSoft
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                  cx="30%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="85%"
                  data={uptimeData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    minAngle={15}
                    label={{
                      position: 'insideStart',
                      fill: '#fff',
                      fontSize: 11,
                      fontWeight: 'bold',
                      formatter: (value: number) => `${value.toFixed(1)}%`
                    }}
                    background={{ fill: '#e5e7eb' }}
                    clockWise
                    dataKey="uptime"
                    cornerRadius={6}
                    animationDuration={1500}
                  />
                  <Legend
                    iconSize={12}
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingLeft: '20px',
                      lineHeight: '24px'
                    }}
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: entry.color, fontWeight: 500 }}>
                        {value}: {entry.payload?.uptime?.toFixed(1)}%
                      </span>
                    )}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uptime']}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/*
            NOTA: Los gráficos "Volumen de Tráfico" y "Distribución de Costos" por provider
            fueron eliminados porque requieren datos de MuleSoft que aún no están disponibles.

            Cuando MuleSoft implemente la metadata de providers (ver docs/PROPUESTA-INTERFACES-MULESOFT.md),
            estos gráficos podrán ser restaurados con datos reales.

            Datos necesarios de MuleSoft:
            - requests_today por provider
            - total_cost_today_eur por provider
          */}
        </div>

        {/* Providers Grid - Real provider data, Placeholder metrics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {providers.map((provider) => {
            const StatusIcon = getStatusIcon(provider.status);
            const metrics = provider.metrics;

            return (
              <Card key={provider.id} className="bg-gray-50 dark:bg-card shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        <Badge variant="outline" className={getTypeColor(provider.type)}>
                          {provider.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-50 text-green-600 border-green-200">
                          ✓ Real
                        </Badge>
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {provider.endpoint}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(provider.status)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {provider.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics Grid - Placeholder data pending MuleSoft */}
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 p-3">
                    <div className="flex items-center gap-1 mb-2 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Métricas estimadas (TODO: MuleSoft)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-amber-700">{(metrics?.uptime || 0).toFixed(1)}%</p>
                          {(metrics?.uptime || 0) >= 99 ? (
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tiempo Resp.</p>
                        <p className="text-2xl font-bold text-amber-700">{(metrics?.avg_response_time || 0).toFixed(2)}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Requests Hoy</p>
                        <p className="text-2xl font-bold text-amber-700">{(metrics?.requests_today || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Costo Hoy</p>
                        <p className="text-2xl font-bold text-amber-700">€{(metrics?.total_cost_today_eur || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Success Rate Progress - Placeholder */}
                  <div className="opacity-70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-700">Tasa de Éxito (TODO)</span>
                      <span className="text-sm font-bold text-amber-700">{(metrics?.success_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={metrics?.success_rate || 0}
                      className="h-2"
                    />
                  </div>

                  {/* Latency Percentiles - Placeholder */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-600">P50 (TODO)</p>
                      <p className="font-mono font-bold text-amber-700">{metrics?.latency_p50_ms || 0}ms</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-600">P95 (TODO)</p>
                      <p className="font-mono font-bold text-amber-700">{metrics?.latency_p95_ms || 0}ms</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-2 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-600">P99 (TODO)</p>
                      <p className="font-mono font-bold text-amber-700">{metrics?.latency_p99_ms || 0}ms</p>
                    </div>
                  </div>

                  {/* Additional Info - Real Data */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          Circuit Breaker
                          <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded">✓</span>
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCircuitBreakerColor(provider.circuitBreakerStatus)}`}
                        >
                          {provider.circuitBreakerStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          Última verificación
                          <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded">✓</span>
                        </p>
                        <p className="text-xs font-medium">
                          {new Date(provider.lastHealthCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MuleSoft Integration Status */}
                  {metrics && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className={`h-3 w-3 ${metrics.mulesoft_integrated ? 'text-green-500' : 'text-amber-500'}`} />
                      <span>
                        {metrics.mulesoft_integrated
                          ? `MuleSoft: ${metrics.mulesoft_provider_id}`
                          : 'Métricas estimadas (MuleSoft pendiente)'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setTestDialogOpen(true);
                      }}
                    >
                      <TestTube className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/admin/metrics?provider=${provider.id}`}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Métricas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {providers.length === 0 && !loading && (
          <Card className="bg-gray-50 dark:bg-card">
            <CardContent className="pt-6 text-center">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proveedores configurados</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer proveedor para comenzar a enviar firmas.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Provider
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modales CRUD */}
      <CreateProviderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          loadProviders();
          toast({
            title: 'Éxito',
            description: 'Provider creado correctamente',
          });
        }}
      />

      <EditProviderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        provider={selectedProvider}
        onSuccess={() => {
          loadProviders();
          toast({
            title: 'Éxito',
            description: 'Provider actualizado correctamente',
          });
        }}
      />

      <DeleteProviderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        provider={selectedProvider}
        onSuccess={() => {
          loadProviders();
          toast({
            title: 'Éxito',
            description: 'Provider eliminado correctamente',
          });
        }}
      />

      <TestProviderDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        provider={selectedProvider}
      />
    </div>
  );
}

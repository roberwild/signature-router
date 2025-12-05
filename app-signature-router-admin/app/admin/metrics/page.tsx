'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Timer,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { useApiClient } from '@/lib/api/use-api-client';
import type { MetricsData } from '@/lib/api/types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function MetricsPage() {
  const apiClient = useApiClient();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [range, apiClient]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMetrics(range);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Valores por defecto para datos incompletos del backend
  const defaultChannelData = { average: 0, median: 0, p95: 0 };
  const defaultChallengeData = { totalChallenges: 0, averageResponseTime: 0, completionRate: 0 };

  const safeMetrics = metrics ? {
    ...metrics,
    signatureDuration: {
      average: metrics.signatureDuration?.average ?? 0,
      median: metrics.signatureDuration?.median ?? 0,
      p95: metrics.signatureDuration?.p95 ?? 0,
      byChannel: metrics.signatureDuration?.byChannel ?? {},
      timeline: metrics.signatureDuration?.timeline ?? [],
    },
    challengeCompletion: {
      averageResponseTime: metrics.challengeCompletion?.averageResponseTime ?? 0,
      byChannel: metrics.challengeCompletion?.byChannel ?? {},
      timeline: metrics.challengeCompletion?.timeline ?? [],
    },
    fallbackMetrics: {
      fallbackRate: metrics.fallbackMetrics?.fallbackRate ?? 0,
      totalFallbacks: metrics.fallbackMetrics?.totalFallbacks ?? 0,
      byChannelTransition: metrics.fallbackMetrics?.byChannelTransition ?? {},
    },
    latency: {
      current: {
        p50: metrics.latency?.current?.p50 ?? 0,
        p95: metrics.latency?.current?.p95 ?? 0,
        p99: metrics.latency?.current?.p99 ?? 0,
      },
      timeline: metrics.latency?.timeline ?? [],
    },
    errorRate: {
      overall: metrics.errorRate?.overall ?? 0,
      timeline: metrics.errorRate?.timeline ?? [],
    },
  } : null;

  if (loading || !safeMetrics) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  // Usar safeMetrics en lugar de metrics para el render
  const m = safeMetrics;

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Métricas del Sistema"
                info="Análisis de rendimiento con signedAt y completedAt"
              />
            </div>
            <div className="flex gap-2">
              <Badge
                variant={range === '1d' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setRange('1d')}
              >
                24h
              </Badge>
              <Badge
                variant={range === '7d' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setRange('7d')}
              >
                7 días
              </Badge>
              <Badge
                variant={range === '30d' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setRange('30d')}
              >
                30 días
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Signature Duration Metrics (using signedAt) - DATOS REALES */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Duración de Firmas (signedAt Analytics)
            <Badge variant="outline" className="ml-2 text-green-600 border-green-300 bg-green-50">
              ✓ Datos reales
            </Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Promedio</p>
                    <p className="text-2xl font-bold">{m.signatureDuration.average.toFixed(1)}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mediana</p>
                    <p className="text-2xl font-bold">{m.signatureDuration.median.toFixed(1)}s</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P95</p>
                    <p className="text-2xl font-bold">{m.signatureDuration.p95.toFixed(1)}s</p>
                    <p className="text-xs text-muted-foreground">95 percentil</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Duration by Channel */}
          <Card className="bg-gray-50 dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Duración por Canal</CardTitle>
              <CardDescription>Tiempo promedio desde creación hasta firma completada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(m.signatureDuration.byChannel).map(([channel, data]: [string, any]) => {
                const channelColors = {
                  SMS: 'bg-blue-500',
                  PUSH: 'bg-purple-500',
                  VOICE: 'bg-orange-500',
                  BIOMETRIC: 'bg-green-500',
                };

                return (
                  <div key={channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${channelColors[channel as keyof typeof channelColors]}`}
                        />
                        <span className="font-medium">{channel}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">{data.average.toFixed(1)}s</p>
                          <p className="text-xs text-muted-foreground">Promedio</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{data.median.toFixed(1)}s</p>
                          <p className="text-xs text-muted-foreground">Mediana</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-medium">{data.p95.toFixed(1)}s</p>
                          <p className="text-xs text-muted-foreground">P95</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={Math.min((data.average / 30) * 100, 100)} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Challenge Completion Metrics (using completedAt) - DATOS REALES */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Completado de Desafíos (completedAt Analytics)
            <Badge variant="outline" className="ml-2 text-green-600 border-green-300 bg-green-50">
              ✓ Datos reales
            </Badge>
          </h2>
          <Card className="bg-gray-50 dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Tiempo de Respuesta por Canal</CardTitle>
              <CardDescription>
                Tiempo desde envío (sentAt) hasta completado (completedAt)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(m.challengeCompletion.byChannel).map(([channel, data]: [string, any]) => {
                const channelColors = {
                  SMS: 'bg-blue-500',
                  PUSH: 'bg-purple-500',
                  VOICE: 'bg-orange-500',
                  BIOMETRIC: 'bg-green-500',
                };

                return (
                  <div key={channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${channelColors[channel as keyof typeof channelColors]}`}
                        />
                        <span className="font-medium">{channel}</span>
                        <Badge variant="outline" className="text-xs">
                          {data.totalChallenges} desafíos
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">{data.averageResponseTime.toFixed(1)}s</p>
                          <p className="text-xs text-muted-foreground">Tiempo resp.</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-medium text-green-600">
                            {data.completionRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Completado</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={data.completionRate} className="h-2" />
                  </div>
                );
              })}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Promedio General</span>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {m.challengeCompletion.averageResponseTime.toFixed(1)}s
                    </p>
                    <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fallback Analytics (from routing timeline) - DATOS REALES */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Análisis de Fallbacks (Routing Timeline)
            <Badge variant="outline" className="ml-2 text-green-600 border-green-300 bg-green-50">
              ✓ Datos reales
            </Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Fallback</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {m.fallbackMetrics.fallbackRate.toFixed(1)}%
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Fallbacks</p>
                    <p className="text-2xl font-bold">{m.fallbackMetrics.totalFallbacks}</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transiciones</p>
                    <p className="text-2xl font-bold">
                      {Object.keys(m.fallbackMetrics.byChannelTransition).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tipos únicos</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-50 dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Transiciones de Fallback por Canal</CardTitle>
              <CardDescription>Eventos FALLBACK_TRIGGERED detectados en routing timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(m.fallbackMetrics.byChannelTransition)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([transition, count]) => {
                  const maxCount = Math.max(...Object.values(m.fallbackMetrics.byChannelTransition));
                  const percentage = ((count as number) / maxCount) * 100;

                  return (
                    <div key={transition} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {transition}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground ml-1">fallbacks</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}

              {Object.keys(m.fallbackMetrics.byChannelTransition).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No se detectaron fallbacks en este período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Traditional Performance Metrics - LATENCIA TODO DYNATRACE */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Métricas de Rendimiento
            <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 bg-amber-50">
              ⚠️ TODO: Dynatrace
            </Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">P50 (TODO)</p>
                    <p className="text-2xl font-bold text-amber-600">{m.latency.current.p50}ms</p>
                    <p className="text-xs text-amber-500">Placeholder</p>
                  </div>
                  <Zap className="h-8 w-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">P95 (TODO)</p>
                    <p className="text-2xl font-bold text-amber-600">{m.latency.current.p95}ms</p>
                    <p className="text-xs text-amber-500">Placeholder</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">P99 (TODO)</p>
                    <p className="text-2xl font-bold text-amber-600">{m.latency.current.p99}ms</p>
                    <p className="text-xs text-amber-500">Placeholder</p>
                  </div>
                  <Activity className="h-8 w-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold text-red-600">{m.errorRate.overall.toFixed(1)}%</p>
                    <p className="text-xs text-green-500">✓ Datos reales</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Latency Timeline Chart - TODO DYNATRACE */}
        <Card className="bg-gray-50 dark:bg-card shadow-sm border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-amber-600">Evolución de Latencia (TODO)</CardTitle>
                <CardDescription>P50, P95 y P99 a lo largo del tiempo - Placeholder con valores random</CardDescription>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                ⚠️ Dynatrace
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={m.latency.timeline}>
                <defs>
                  <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  fill="url(#colorP50)"
                  animationDuration={2000}
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5 }}
                  fill="url(#colorP95)"
                  animationDuration={2000}
                />
                <Line
                  type="monotone"
                  dataKey="p99"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 5 }}
                  fill="url(#colorP99)"
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Signature Duration Timeline - DATOS REALES */}
        <Card className="bg-gray-50 dark:bg-card shadow-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Duración de Firmas en el Tiempo</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                ✓ Real
              </Badge>
            </div>
            <CardDescription>Tiempo promedio y mediana desde creación hasta firma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={m.signatureDuration.timeline}>
                <defs>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'segundos', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="average"
                  fill="url(#colorAverage)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  animationDuration={2000}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  animationDuration={2000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Error Rate Timeline - DATOS REALES */}
        <Card className="bg-gray-50 dark:bg-card shadow-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Evolución de Tasa de Error</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                ✓ Real
              </Badge>
            </div>
            <CardDescription>Porcentaje de errores a lo largo del tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={m.errorRate.timeline}>
                <defs>
                  <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 5]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorError)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Challenge Completion Timeline - DATOS REALES */}
        <Card className="bg-gray-50 dark:bg-card shadow-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tasa de Completado de Desafíos</CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                ✓ Real
              </Badge>
            </div>
            <CardDescription>Evolución del tiempo de respuesta y porcentaje de completado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={m.challengeCompletion.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'segundos', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="right"
                  dataKey="completionRate"
                  fill="#10b981"
                  opacity={0.7}
                  radius={[8, 8, 0, 0]}
                  animationDuration={2000}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  animationDuration={2000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Integration with Dynatrace */}
        <Card className="bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Observabilidad con Dynatrace</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Monitorización inteligente con AI-powered insights y distributed tracing
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    <Activity className="mr-1 h-3 w-3" />
                    APM
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Real User Monitoring
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    <Zap className="mr-1 h-3 w-3" />
                    Distributed Tracing
                  </Badge>
                </div>
              </div>
              <Activity className="h-16 w-16 text-emerald-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

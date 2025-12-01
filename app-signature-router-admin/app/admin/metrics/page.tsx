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
import { apiClient } from '@/lib/api/client';
import type { MetricsData } from '@/lib/api/types';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [range]);

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

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
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
        {/* Signature Duration Metrics (using signedAt) */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Duración de Firmas (signedAt Analytics)
          </h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Promedio</p>
                    <p className="text-2xl font-bold">{metrics.signatureDuration.average.toFixed(1)}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mediana</p>
                    <p className="text-2xl font-bold">{metrics.signatureDuration.median.toFixed(1)}s</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P95</p>
                    <p className="text-2xl font-bold">{metrics.signatureDuration.p95.toFixed(1)}s</p>
                    <p className="text-xs text-muted-foreground">95 percentil</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Duration by Channel */}
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Duración por Canal</CardTitle>
              <CardDescription>Tiempo promedio desde creación hasta firma completada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.signatureDuration.byChannel).map(([channel, data]: [string, any]) => {
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

        {/* Challenge Completion Metrics (using completedAt) */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Completado de Desafíos (completedAt Analytics)
          </h2>
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Tiempo de Respuesta por Canal</CardTitle>
              <CardDescription>
                Tiempo desde envío (sentAt) hasta completado (completedAt)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.challengeCompletion.byChannel).map(([channel, data]: [string, any]) => {
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
                      {metrics.challengeCompletion.averageResponseTime.toFixed(1)}s
                    </p>
                    <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fallback Analytics (from routing timeline) */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Análisis de Fallbacks (Routing Timeline)
          </h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Fallback</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics.fallbackMetrics.fallbackRate.toFixed(1)}%
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Fallbacks</p>
                    <p className="text-2xl font-bold">{metrics.fallbackMetrics.totalFallbacks}</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transiciones</p>
                    <p className="text-2xl font-bold">
                      {Object.keys(metrics.fallbackMetrics.byChannelTransition).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tipos únicos</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Transiciones de Fallback por Canal</CardTitle>
              <CardDescription>Eventos FALLBACK_TRIGGERED detectados en routing timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(metrics.fallbackMetrics.byChannelTransition)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([transition, count]) => {
                  const maxCount = Math.max(...Object.values(metrics.fallbackMetrics.byChannelTransition));
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

              {Object.keys(metrics.fallbackMetrics.byChannelTransition).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No se detectaron fallbacks en este período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Traditional Performance Metrics */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Métricas de Rendimiento
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P50</p>
                    <p className="text-2xl font-bold">{metrics.latency.current.p50}ms</p>
                  </div>
                  <Zap className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P95</p>
                    <p className="text-2xl font-bold">{metrics.latency.current.p95}ms</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P99</p>
                    <p className="text-2xl font-bold">{metrics.latency.current.p99}ms</p>
                  </div>
                  <Activity className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.errorRate.overall.toFixed(1)}%</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration with Grafana */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Dashboards Avanzados en Grafana</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualiza métricas detalladas con Prometheus + Grafana
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Activity className="mr-1 h-3 w-3" />
                    Prometheus
                  </Badge>
                  <Badge variant="outline">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Grafana
                  </Badge>
                  <Badge variant="outline">
                    <Zap className="mr-1 h-3 w-3" />
                    Jaeger Tracing
                  </Badge>
                </div>
              </div>
              <Activity className="h-16 w-16 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

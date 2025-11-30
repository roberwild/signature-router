'use client';

import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminPageTitle } from '@/components/admin/admin-page-title';

export default function MetricsPage() {
  // Mock data - TODO: Conectar con backend Spring Boot + Prometheus
  const performanceMetrics = {
    p50: 0.8,
    p95: 2.3,
    p99: 4.1,
    avg: 1.2,
  };

  const channelMetrics = [
    { channel: 'SMS', total: 8521, success: 8434, failed: 87, avgTime: 1.2, cost: 63.91 },
    { channel: 'PUSH', total: 2134, success: 2098, failed: 36, avgTime: 0.8, cost: 2.13 },
    { channel: 'VOICE', total: 1543, success: 1512, failed: 31, avgTime: 3.5, cost: 38.58 },
    { channel: 'BIOMETRIC', total: 345, success: 341, failed: 4, avgTime: 2.1, cost: 17.25 },
  ];

  const hourlyData = [
    { hour: '00:00', requests: 45, success: 44 },
    { hour: '01:00', requests: 32, success: 31 },
    { hour: '02:00', requests: 28, success: 28 },
    { hour: '03:00', requests: 21, success: 21 },
    { hour: '04:00', requests: 19, success: 18 },
    { hour: '05:00', requests: 34, success: 33 },
    { hour: '06:00', requests: 67, success: 66 },
    { hour: '07:00', requests: 124, success: 122 },
    { hour: '08:00', requests: 287, success: 283 },
    { hour: '09:00', requests: 456, success: 451 },
    { hour: '10:00', requests: 523, success: 516 },
    { hour: '11:00', requests: 612, success: 603 },
    { hour: '12:00', requests: 734, success: 723 },
    { hour: '13:00', requests: 689, success: 679 },
    { hour: '14:00', requests: 598, success: 589 },
  ];

  const slaMetrics = {
    availability: 99.9,
    targetAvailability: 99.5,
    mttr: 15, // minutes
    mtbf: 720, // hours
    errorBudget: 0.1,
    errorBudgetUsed: 0.01,
  };

  const totalRequests = channelMetrics.reduce((acc, m) => acc + m.total, 0);
  const totalSuccess = channelMetrics.reduce((acc, m) => acc + m.success, 0);
  const totalFailed = channelMetrics.reduce((acc, m) => acc + m.failed, 0);
  const totalCost = channelMetrics.reduce((acc, m) => acc + m.cost, 0);
  const overallSuccessRate = (totalSuccess / totalRequests) * 100;

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Métricas del Sistema"
              info="Análisis de rendimiento y estadísticas operacionales"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">P50</p>
                  <p className="text-2xl font-bold">{performanceMetrics.p50}s</p>
                  <p className="text-xs text-muted-foreground">Mediana</p>
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
                  <p className="text-2xl font-bold">{performanceMetrics.p95}s</p>
                  <p className="text-xs text-muted-foreground">95 Percentil</p>
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
                  <p className="text-2xl font-bold">{performanceMetrics.p99}s</p>
                  <p className="text-xs text-muted-foreground">99 Percentil</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-bold">{performanceMetrics.avg}s</p>
                  <p className="text-xs text-muted-foreground">Media general</p>
                </div>
                <Clock className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel Metrics */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Métricas por Canal</CardTitle>
            <CardDescription>Rendimiento detallado de cada tipo de firma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {channelMetrics.map((metric) => {
                const successRate = (metric.success / metric.total) * 100;
                const channelColors = {
                  SMS: 'bg-blue-500',
                  PUSH: 'bg-purple-500',
                  VOICE: 'bg-orange-500',
                  BIOMETRIC: 'bg-green-500',
                };
                return (
                  <div key={metric.channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${channelColors[metric.channel as keyof typeof channelColors]}`}
                        />
                        <span className="font-medium">{metric.channel}</span>
                        <Badge variant="outline" className="text-xs">
                          {metric.total.toLocaleString()} requests
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{successRate.toFixed(2)}%</p>
                          <p className="text-xs text-muted-foreground">
                            {metric.success.toLocaleString()} ✓ / {metric.failed} ✗
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{metric.avgTime}s</p>
                          <p className="text-xs text-muted-foreground">Tiempo avg</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-medium">${metric.cost.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Costo</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={successRate} className="h-2" />
                  </div>
                );
              })}
              {/* Total Summary */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">TOTAL</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">{overallSuccessRate.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {totalSuccess.toLocaleString()} ✓ / {totalFailed} ✗
                      </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-bold">${totalCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Metrics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>SLO & Disponibilidad</CardTitle>
              <CardDescription>Cumplimiento de objetivos de nivel de servicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Disponibilidad Actual</span>
                  <span className="text-2xl font-bold text-green-600">
                    {slaMetrics.availability}%
                  </span>
                </div>
                <Progress value={slaMetrics.availability} className="h-3 mb-1" />
                <p className="text-xs text-muted-foreground">
                  Objetivo: {slaMetrics.targetAvailability}% | 
                  Margen: +{(slaMetrics.availability - slaMetrics.targetAvailability).toFixed(1)}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">MTTR</p>
                  <p className="text-xl font-bold">{slaMetrics.mttr} min</p>
                  <p className="text-xs text-muted-foreground">Tiempo medio de recuperación</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">MTBF</p>
                  <p className="text-xl font-bold">{slaMetrics.mtbf}h</p>
                  <p className="text-xs text-muted-foreground">Tiempo entre fallos</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Error Budget Usado</span>
                  <span className="text-sm font-bold text-green-600">
                    {((slaMetrics.errorBudgetUsed / slaMetrics.errorBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(slaMetrics.errorBudgetUsed / slaMetrics.errorBudget) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {slaMetrics.errorBudgetUsed}% usado de {slaMetrics.errorBudget}% disponible
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Tráfico por Hora</CardTitle>
              <CardDescription>Distribución de requests en las últimas horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hourlyData.slice(-10).map((data) => {
                  const max = Math.max(...hourlyData.map(d => d.requests));
                  const percentage = (data.requests / max) * 100;
                  const successRate = (data.success / data.requests) * 100;
                  return (
                    <div key={data.hour}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{data.hour}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{data.requests}</span>
                          {successRate === 100 ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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


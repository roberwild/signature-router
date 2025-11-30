'use client';

import { useState } from 'react';
import {
  Server,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings,
  BarChart3,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminPageTitle } from '@/components/admin/admin-page-title';

interface Provider {
  id: string;
  name: string;
  type: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  avgResponseTime: number;
  requestsToday: number;
  successRate: number;
  costPerRequest: number;
  totalCostToday: number;
  circuitBreakerStatus: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastHealthCheck: string;
  endpoint: string;
}

export default function ProvidersPage() {
  const providers: Provider[] = [
    {
      id: 'twilio-sms',
      name: 'Twilio SMS',
      type: 'SMS',
      status: 'healthy',
      uptime: 99.9,
      avgResponseTime: 1.2,
      requestsToday: 8521,
      successRate: 98.9,
      costPerRequest: 0.0075,
      totalCostToday: 63.91,
      circuitBreakerStatus: 'CLOSED',
      lastHealthCheck: '2024-11-29 14:32:00',
      endpoint: 'https://api.twilio.com/2010-04-01',
    },
    {
      id: 'onesignal-push',
      name: 'OneSignal Push',
      type: 'PUSH',
      status: 'healthy',
      uptime: 99.8,
      avgResponseTime: 0.8,
      requestsToday: 2134,
      successRate: 98.3,
      costPerRequest: 0.001,
      totalCostToday: 2.13,
      circuitBreakerStatus: 'CLOSED',
      lastHealthCheck: '2024-11-29 14:31:45',
      endpoint: 'https://onesignal.com/api/v1',
    },
    {
      id: 'vonage-voice',
      name: 'Vonage Voice',
      type: 'VOICE',
      status: 'degraded',
      uptime: 95.2,
      avgResponseTime: 3.5,
      requestsToday: 1543,
      successRate: 94.5,
      costPerRequest: 0.025,
      totalCostToday: 38.58,
      circuitBreakerStatus: 'HALF_OPEN',
      lastHealthCheck: '2024-11-29 14:30:15',
      endpoint: 'https://api.nexmo.com/v1',
    },
    {
      id: 'biocatch',
      name: 'BioCatch Biometric',
      type: 'BIOMETRIC',
      status: 'healthy',
      uptime: 99.7,
      avgResponseTime: 2.1,
      requestsToday: 345,
      successRate: 99.1,
      costPerRequest: 0.05,
      totalCostToday: 17.25,
      circuitBreakerStatus: 'CLOSED',
      lastHealthCheck: '2024-11-29 14:32:10',
      endpoint: 'https://api.biocatch.com/v2',
    },
    {
      id: 'aws-sns',
      name: 'AWS SNS Backup',
      type: 'SMS',
      status: 'healthy',
      uptime: 100.0,
      avgResponseTime: 1.5,
      requestsToday: 234,
      successRate: 99.6,
      costPerRequest: 0.0065,
      totalCostToday: 1.52,
      circuitBreakerStatus: 'CLOSED',
      lastHealthCheck: '2024-11-29 14:31:55',
      endpoint: 'https://sns.us-east-1.amazonaws.com',
    },
  ];

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

  const totalStats = {
    totalRequests: providers.reduce((acc, p) => acc + p.requestsToday, 0),
    totalCost: providers.reduce((acc, p) => acc + p.totalCostToday, 0),
    avgSuccessRate:
      providers.reduce((acc, p) => acc + p.successRate, 0) / providers.length,
    avgResponseTime:
      providers.reduce((acc, p) => acc + p.avgResponseTime, 0) / providers.length,
  };

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Gestión de Proveedores"
                info="Monitoreo y configuración de servicios externos"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Settings className="mr-2 h-4 w-4" />
              Configurar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requests Hoy</p>
                  <p className="text-2xl font-bold">{totalStats.totalRequests.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Costo Total</p>
                  <p className="text-2xl font-bold">${totalStats.totalCost.toFixed(2)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Éxito Promedio</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalStats.avgSuccessRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tiempo Resp.</p>
                  <p className="text-2xl font-bold">{totalStats.avgResponseTime.toFixed(1)}s</p>
                </div>
                <Zap className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {providers.map((provider) => {
            const StatusIcon = getStatusIcon(provider.status);
            return (
              <Card key={provider.id} className="bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        <Badge variant="outline" className={getTypeColor(provider.type)}>
                          {provider.type}
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
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{provider.uptime}%</p>
                        {provider.uptime >= 99 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo Resp.</p>
                      <p className="text-2xl font-bold">{provider.avgResponseTime}s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requests Hoy</p>
                      <p className="text-2xl font-bold">{provider.requestsToday.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Hoy</p>
                      <p className="text-2xl font-bold">${provider.totalCostToday.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Success Rate Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasa de Éxito</span>
                      <span className="text-sm font-bold">{provider.successRate}%</span>
                    </div>
                    <Progress
                      value={provider.successRate}
                      className="h-2"
                    />
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Circuit Breaker</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCircuitBreakerColor(provider.circuitBreakerStatus)}`}
                        >
                          {provider.circuitBreakerStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Última verificación</p>
                        <p className="text-xs font-medium">
                          {new Date(provider.lastHealthCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cost per Request */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Costo por Request</span>
                    <span className="text-sm font-mono font-medium">
                      ${provider.costPerRequest.toFixed(4)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Métricas
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cost Analysis */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Análisis de Costos por Proveedor</CardTitle>
            <CardDescription>Distribución de costos del día de hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers
                .sort((a, b) => b.totalCostToday - a.totalCostToday)
                .map((provider) => {
                  const percentage = (provider.totalCostToday / totalStats.totalCost) * 100;
                  return (
                    <div key={provider.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{provider.name}</span>
                          <Badge variant="outline" className={getTypeColor(provider.type)}>
                            {provider.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {provider.requestsToday.toLocaleString()} requests
                          </span>
                          <span className="text-sm font-bold min-w-[80px] text-right">
                            ${provider.totalCostToday.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


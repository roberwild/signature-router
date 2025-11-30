'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileWarning, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';

interface IncidentStatsCardProps {
  organizationId: string;
  organizationSlug: string;
}

interface IncidentStats {
  total: number;
  open: number;
  resolved: number;
  averageResolutionTime: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  notifiedAEPD: number;
  criticalIncidents: number;
}

export function IncidentStatsCard({ organizationId, organizationSlug }: IncidentStatsCardProps) {
  const [stats, _setStats] = useState<IncidentStats>({
    total: 12,
    open: 3,
    resolved: 9,
    averageResolutionTime: 48,
    trend: 'down',
    trendPercentage: 25,
    notifiedAEPD: 2,
    criticalIncidents: 1,
  });

  // TODO: Fetch real incident statistics
  useEffect(() => {
    // Simulate data fetching
  }, [organizationId]);

  const getTrendIcon = () => {
    if (stats.trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (stats.trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (stats.trend === 'down') {
      return (
        <span className="text-green-600">
          {stats.trendPercentage}% menos que el mes anterior
        </span>
      );
    } else if (stats.trend === 'up') {
      return (
        <span className="text-red-600">
          {stats.trendPercentage}% más que el mes anterior
        </span>
      );
    }
    return <span className="text-muted-foreground">Sin cambios</span>;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-primary" />
            <CardTitle>Registro de Incidentes</CardTitle>
          </div>
          {stats.criticalIncidents > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats.criticalIncidents} Crítico{stats.criticalIncidents > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <CardDescription>
          Gestión y seguimiento de incidentes de seguridad
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Abiertos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resueltos</p>
          </div>
        </div>

        <Separator />

        {/* Trend Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium">Tendencia Mensual</span>
          </div>
          <p className="text-sm">{getTrendText()}</p>
        </div>

        {/* Key Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tiempo promedio resolución</span>
            </div>
            <span className="text-sm font-medium">{stats.averageResolutionTime}h</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Notificados a AEPD</span>
            </div>
            <span className="text-sm font-medium">{stats.notifiedAEPD}</span>
          </div>
        </div>

        {/* Recent Incidents Preview */}
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Incidentes Recientes</p>
          <div className="space-y-2">
            {[
              { id: 1, title: 'Acceso no autorizado', status: 'open', severity: 'high' },
              { id: 2, title: 'Fuga de datos menor', status: 'resolved', severity: 'low' },
              { id: 3, title: 'Intento de phishing', status: 'open', severity: 'medium' },
            ].map((incident) => (
              <div key={incident.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {incident.status === 'open' ? (
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span className="text-sm truncate max-w-[150px]">{incident.title}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    incident.severity === 'high' && "border-red-500/50 text-red-700",
                    incident.severity === 'medium' && "border-yellow-500/50 text-yellow-700",
                    incident.severity === 'low' && "border-green-500/50 text-green-700"
                  )}
                >
                  {incident.severity === 'high' ? 'Alto' : 
                   incident.severity === 'medium' ? 'Medio' : 'Bajo'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Link href={`/organizations/${organizationSlug}/incidents`} className="w-full">
          <Button variant="outline" className="w-full">
            Ver todos los incidentes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
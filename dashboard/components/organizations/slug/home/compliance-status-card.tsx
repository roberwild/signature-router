'use client';

import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { cn } from '@workspace/ui/lib/utils';

interface ComplianceStatusCardProps {
  organizationId: string;
}

export function ComplianceStatusCard({ organizationId: _organizationId }: ComplianceStatusCardProps) {
  // TODO: Fetch real compliance data
  const complianceScore = 78;
  const status = complianceScore >= 80 ? 'compliant' : complianceScore >= 60 ? 'partial' : 'non-compliant';
  
  const requirements = [
    { name: 'Registro de Incidentes', status: 'complete', required: true },
    { name: 'DPO Designado', status: 'complete', required: true },
    { name: 'Evaluación de Riesgos', status: 'partial', required: true },
    { name: 'Plan de Respuesta', status: 'incomplete', required: false },
    { name: 'Auditoría Anual', status: 'pending', required: false },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Cumpliendo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Parcial</Badge>;
      default:
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Acción Requerida</Badge>;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={cn(
        "absolute inset-x-0 top-0 h-1",
        status === 'compliant' ? 'bg-green-500' :
        status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
      )} />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Estado de Cumplimiento</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Cumplimiento RGPD y normativas de ciberseguridad
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Puntuación Global</span>
            <span className="text-2xl font-bold">{complianceScore}%</span>
          </div>
          <Progress value={complianceScore} className="h-2" />
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Requisitos</p>
          {requirements.map((req) => (
            <div key={req.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(req.status)}
                <span className={cn(
                  "text-sm",
                  req.status === 'incomplete' && req.required && "font-medium"
                )}>
                  {req.name}
                </span>
              </div>
              {req.required && (
                <Badge variant="outline" className="text-xs">
                  Obligatorio
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Action Required */}
        {status !== 'compliant' && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-destructive mb-1">
              Acción Requerida
            </p>
            <p className="text-xs text-muted-foreground">
              Complete los requisitos obligatorios para alcanzar el cumplimiento total.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
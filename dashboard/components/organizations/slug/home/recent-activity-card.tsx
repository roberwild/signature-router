'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  FileWarning,
  ClipboardCheck,
  UserCheck,
  Settings,
  Clock,
  Shield
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { cn } from '@workspace/ui/lib/utils';

interface RecentActivityCardProps {
  organizationId: string;
}

type ActivityType = 'incident' | 'assessment' | 'compliance' | 'user' | 'system';
type ActivityPriority = 'high' | 'medium' | 'low';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  priority: ActivityPriority;
  user?: string;
  metadata?: Record<string, unknown>;
}

export function RecentActivityCard({ organizationId }: RecentActivityCardProps) {
  const [activities, _setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'incident',
      title: 'Incidente reportado',
      description: 'Acceso no autorizado detectado en servidor de producción',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      priority: 'high',
      user: 'María García',
    },
    {
      id: '2',
      type: 'assessment',
      title: 'Evaluación completada',
      description: 'Puntuación de seguridad mejorada a 72/100',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      priority: 'medium',
      user: 'Carlos López',
    },
    {
      id: '3',
      type: 'compliance',
      title: 'Requisito cumplido',
      description: 'DPO designado correctamente en el sistema',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      priority: 'low',
      user: 'Sistema',
    },
    {
      id: '4',
      type: 'incident',
      title: 'Incidente resuelto',
      description: 'Intento de phishing mitigado exitosamente',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      priority: 'medium',
      user: 'Ana Martínez',
    },
    {
      id: '5',
      type: 'system',
      title: 'Actualización de seguridad',
      description: 'Parches críticos aplicados en todos los sistemas',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      priority: 'high',
      user: 'Sistema',
    },
    {
      id: '6',
      type: 'user',
      title: 'Nuevo miembro del equipo',
      description: 'Pedro Sánchez añadido como administrador de seguridad',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
      priority: 'low',
      user: 'Admin',
    },
  ]);

  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  // TODO: Fetch real activity data
  useEffect(() => {
    // Simulate data fetching
  }, [organizationId]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'incident':
        return FileWarning;
      case 'assessment':
        return ClipboardCheck;
      case 'compliance':
        return Shield;
      case 'user':
        return UserCheck;
      case 'system':
        return Settings;
      default:
        return Activity;
    }
  };

  const getPriorityColor = (priority: ActivityPriority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
    }
  };

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'incident':
        return 'border-red-500/20 bg-red-500/5';
      case 'assessment':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'compliance':
        return 'border-green-500/20 bg-green-500/5';
      case 'user':
        return 'border-purple-500/20 bg-purple-500/5';
      case 'system':
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const getTypeBadge = (type: ActivityType) => {
    const labels = {
      incident: 'Incidente',
      assessment: 'Evaluación',
      compliance: 'Cumplimiento',
      user: 'Usuario',
      system: 'Sistema',
    };
    return labels[type];
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Actividad Reciente</CardTitle>
          </div>
          <Badge variant="secondary">
            {activities.length} eventos esta semana
          </Badge>
        </div>
        <CardDescription>
          Registro de eventos y acciones importantes en tu organización
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>
              Todos
            </TabsTrigger>
            <TabsTrigger value="incident" onClick={() => setFilter('incident')}>
              Incidentes
            </TabsTrigger>
            <TabsTrigger value="assessment" onClick={() => setFilter('assessment')}>
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger value="compliance" onClick={() => setFilter('compliance')}>
              Cumplimiento
            </TabsTrigger>
            <TabsTrigger value="user" onClick={() => setFilter('user')}>
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="system" onClick={() => setFilter('system')}>
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50",
                        getTypeColor(activity.type)
                      )}
                    >
                      {/* Icon Column */}
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        getPriorityColor(activity.priority)
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getTypeBadge(activity.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(activity.timestamp, { 
                              addSuffix: true,
                              locale: es 
                            })}
                          </div>
                          {activity.user && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {activity.user}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No hay actividad reciente en esta categoría
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
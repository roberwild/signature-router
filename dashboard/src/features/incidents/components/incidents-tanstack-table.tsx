'use client';

import * as React from 'react';
import {  useRouter } from 'next/navigation';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  Search,
  History,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Users,
  FileText,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@workspace/ui/components/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { deleteIncident } from '~/actions/incidents/delete-incident';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@workspace/ui/components/hover-card';
import { ExportPDFButton } from './export-pdf-button';

interface IncidentVersion {
  id: string;
  incidentId: string;
  createdBy: string;
  token: string;
  fechaDeteccion?: Date | null;
  descripcion?: string | null;
  tipoIncidente?: string | null;
  numeroAfectados?: number | null;
  fechaResolucion?: Date | null;
  notificadoAEPD?: boolean | null;
  notificadoAfectados?: boolean | null;
  fechaNotificacionAEPD?: Date | null;
  fechaNotificacionAfectados?: Date | null;
  versionNumber: number;
  isLatest: boolean;
  createdAt: Date;
  categoriasDatos?: string | null;
  consecuencias?: string | null;
  medidasAdoptadas?: string | null;
}

interface Incident {
  id: string;
  internalId: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentWithVersion {
  incident: Incident;
  latestVersion: IncidentVersion | null;
  versionCount?: number;
}

interface IncidentsTanstackTableProps {
  incidents: IncidentWithVersion[];
  organizationSlug: string;
}

function getIncidentStatus(version: IncidentVersion | null) {
  if (!version) return { label: 'Sin datos', color: 'bg-gray-500', icon: null };
  
  if (version.fechaResolucion) {
    return { 
      label: 'Resuelto', 
      color: 'bg-green-500',
      icon: <CheckCircle className="h-3 w-3" />
    };
  }
  
  return { 
    label: 'En proceso', 
    color: 'bg-yellow-500',
    icon: <Clock className="h-3 w-3" />
  };
}

function getAEPDDeadlineStatus(fechaDeteccion: Date | null | undefined, notificadoAEPD: boolean | null | undefined) {
  if (!fechaDeteccion) return null;
  if (notificadoAEPD) {
    return { status: 'completed', label: 'Notificado', color: 'text-green-600' };
  }
  
  const detection = new Date(fechaDeteccion);
  const deadline = new Date(detection.getTime() + 72 * 60 * 60 * 1000);
  const now = new Date();
  const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (hoursRemaining < 0) {
    return { 
      status: 'overdue', 
      label: `Vencido hace ${Math.abs(hoursRemaining)}h`, 
      color: 'text-red-600',
      hours: Math.abs(hoursRemaining)
    };
  }
  if (hoursRemaining < 24) {
    return { 
      status: 'critical', 
      label: `${hoursRemaining}h restantes`, 
      color: 'text-red-600',
      hours: hoursRemaining
    };
  }
  if (hoursRemaining < 48) {
    return { 
      status: 'warning', 
      label: `${hoursRemaining}h restantes`, 
      color: 'text-yellow-600',
      hours: hoursRemaining
    };
  }
  return { 
    status: 'ok', 
    label: `${hoursRemaining}h restantes`, 
    color: 'text-green-600',
    hours: hoursRemaining
  };
}

function getSeverityIndicator(numeroAfectados: number | null | undefined, categoriasDatos: string | null | undefined) {
  const affectedCount = numeroAfectados || 0;
  const categoriesCount = categoriasDatos?.split(',').length || 0;
  
  if (affectedCount > 100 || categoriesCount > 3) {
    return { color: 'bg-red-500', label: 'Alta severidad', emoji: '🔴' };
  }
  if (affectedCount > 10 || categoriesCount > 1) {
    return { color: 'bg-yellow-500', label: 'Severidad media', emoji: '🟡' };
  }
  if (affectedCount > 0) {
    return { color: 'bg-green-500', label: 'Baja severidad', emoji: '🟢' };
  }
  return null;
}

export function IncidentsTanstackTable({ incidents, organizationSlug }: IncidentsTanstackTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    categoriasDatos: false,
    consecuencias: false,
    medidasAdoptadas: false,
    updatedAt: false,
  });
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [notificationFilter, setNotificationFilter] = React.useState<string>('all');
  const [quickFilter, setQuickFilter] = React.useState<'all' | 'critical' | 'resolved' | 'pending'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [incidentToDelete, setIncidentToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado al portapapeles');
    } catch (_error) {
      toast.error('Error al copiar el token');
    }
  };

  const handleOpenPublicView = (token: string) => {
    const publicUrl = `${window.location.origin}/verify/${token}`;
    window.open(publicUrl, '_blank');
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteIncident({ incidentId: incidentToDelete });
      
      if (result?.data?.success) {
        toast.success('Incidente eliminado correctamente');
        // The page will be revalidated automatically due to the revalidatePath in the action
        router.refresh();
      } else {
        toast.error('Error al eliminar el incidente');
      }
    } catch (_error) {
      toast.error('Error al eliminar el incidente');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  const columns = React.useMemo<ColumnDef<IncidentWithVersion>[]>(() => [
    {
      id: 'internalId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          ID
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.incident.internalId,
      cell: ({ row }) => (
        <div className="font-medium">
          #{row.original.incident.internalId}
        </div>
      ),
    },
    {
      id: 'tipoIncidente',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Tipo y Descripción
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.latestVersion?.tipoIncidente || '',
      cell: ({ row }) => {
        const version = row.original.latestVersion;
        const severityIndicator = getSeverityIndicator(
          version?.numeroAfectados,
          version?.categoriasDatos
        );
        
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer w-full">
                <div className="flex items-center gap-2">
                  {severityIndicator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`h-2 w-2 rounded-full ${severityIndicator.color} ring-2 ring-offset-1 ring-offset-background ${severityIndicator.color.replace('bg-', 'ring-')}/20`} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{severityIndicator.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <span className="font-medium">
                    {version?.tipoIncidente || 'Sin tipo'}
                  </span>
                </div>
                {version?.descripcion && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-2 truncate">
                    {version.descripcion}
                  </p>
                )}
                {row.original.versionCount && row.original.versionCount > 1 && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {row.original.versionCount} versiones
                  </Badge>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 sm:w-80">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Incidente #{row.original.incident.internalId}
                  </h4>
                  {version?.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {version.descripcion}
                    </p>
                  )}
                </div>
                
                {(version?.categoriasDatos || version?.numeroAfectados) && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    {version.categoriasDatos && (
                      <div>
                        <p className="text-xs text-muted-foreground">Categorías de datos</p>
                        <p className="text-sm font-medium">{version.categoriasDatos}</p>
                      </div>
                    )}
                    {version.numeroAfectados !== null && version.numeroAfectados !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Afectados</p>
                        <p className="text-sm font-medium">{version.numeroAfectados} personas</p>
                      </div>
                    )}
                  </div>
                )}
                
                {version?.consecuencias && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Consecuencias</p>
                    <p className="text-sm mt-1">{version.consecuencias}</p>
                  </div>
                )}
                
                {severityIndicator && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span>{severityIndicator.emoji}</span>
                      <span>{severityIndicator.label}</span>
                    </span>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      id: 'fechaDeteccion',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Fecha Detección
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.latestVersion?.fechaDeteccion,
      sortingFn: 'datetime',
      cell: ({ row }) => {
        const fecha = row.original.latestVersion?.fechaDeteccion;
        return fecha ? (
          <div className="space-y-1">
            <p className="text-sm">{format(new Date(fecha), 'dd/MM/yyyy', { locale: es })}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(fecha), 'HH:mm', { locale: es })}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'estado',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Estado
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.latestVersion?.fechaResolucion ? 'resolved' : 'in_progress',
      cell: ({ row }) => {
        const status = getIncidentStatus(row.original.latestVersion);
        return (
          <Badge className={status.color}>
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        const isResolved = row.original.latestVersion?.fechaResolucion !== null;
        if (value === 'resolved') return isResolved;
        if (value === 'in_progress') return !isResolved;
        return true;
      },
    },
    {
      id: 'plazoAEPD',
      header: () => <span>Plazo AEPD</span>,
      accessorFn: row => {
        const deadline = getAEPDDeadlineStatus(
          row.latestVersion?.fechaDeteccion,
          row.latestVersion?.notificadoAEPD
        );
        return deadline?.hours ?? 999;
      },
      cell: ({ row }) => {
        const deadline = getAEPDDeadlineStatus(
          row.original.latestVersion?.fechaDeteccion,
          row.original.latestVersion?.notificadoAEPD
        );
        
        if (!deadline) return <span className="text-sm text-muted-foreground">-</span>;
        
        return (
          <div className="flex items-center gap-2">
            {deadline.status === 'completed' ? (
              <Badge className="bg-green-500">
                <CheckCircle className="mr-1 h-3 w-3" />
                {deadline.label}
              </Badge>
            ) : deadline.status === 'overdue' || deadline.status === 'critical' ? (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {deadline.label}
              </Badge>
            ) : (
              <Badge variant="outline" className={deadline.color}>
                <Clock className="mr-1 h-3 w-3" />
                {deadline.label}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'notificaciones',
      header: () => <span>Notificaciones</span>,
      accessorFn: row => {
        const aepd = row.latestVersion?.notificadoAEPD ? 1 : 0;
        const afectados = row.latestVersion?.notificadoAfectados ? 1 : 0;
        return aepd + afectados;
      },
      cell: ({ row }) => {
        const version = row.original.latestVersion;
        if (!version) return null;
        
        return (
          <div className="flex flex-col gap-1 max-w-[100px] sm:max-w-none pr-2">
            {version.notificadoAEPD && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 w-fit">
                    AEPD
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Notificado a AEPD
                    {version.fechaNotificacionAEPD && (
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(version.fechaNotificacionAEPD), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {version.notificadoAfectados && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 w-fit">
                    Afectados
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Notificado a afectados
                    {version.fechaNotificacionAfectados && (
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(version.fechaNotificacionAfectados), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {!version.notificadoAEPD && !version.notificadoAfectados && (
              <span className="text-sm text-muted-foreground">Pendiente</span>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        const version = row.original.latestVersion;
        if (!version) return false;
        if (value === 'aepd') return version.notificadoAEPD === true;
        if (value === 'afectados') return version.notificadoAfectados === true;
        if (value === 'pending') return !version.notificadoAEPD || !version.notificadoAfectados;
        return true;
      },
    },
    {
      id: 'afectados',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Afectados
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.latestVersion?.numeroAfectados ?? 0,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 pl-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.latestVersion?.numeroAfectados || 0}</span>
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Creado
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.incident.createdAt,
      sortingFn: 'datetime',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm">
            {format(new Date(row.original.incident.createdAt), 'dd/MM/yyyy', { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(row.original.incident.createdAt), 'HH:mm', { locale: es })}
          </p>
        </div>
      ),
    },
    {
      id: 'updatedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Actualizado
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.incident.updatedAt,
      sortingFn: 'datetime',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.incident.updatedAt), 'dd/MM/yyyy', { locale: es })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const incident = row.original.incident;
        const version = row.original.latestVersion;
        
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* View button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}`)}
                  className="h-8 w-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalles</TooltipContent>
            </Tooltip>
            
            {/* Edit button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}/edit`)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar incidente</TooltipContent>
            </Tooltip>
            
            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Más opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar incidente
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}/history`)}
                >
                  <History className="mr-2 h-4 w-4" />
                  Ver historial
                </DropdownMenuItem>
                
                {version && (
                  <>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => handleCopyToken(version.token)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar token
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => handleOpenPublicView(version.token)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Vista pública
                    </DropdownMenuItem>
                    
                    <ExportPDFButton
                      incident={incident}
                      currentVersion={version}
                      totalVersions={row.original.versionCount || 1}
                      isPublic={false}
                      asMenuItem={true}
                    />
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => {
                        setIncidentToDelete(incident.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar incidente
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [organizationSlug, router]);

  // Filter data based on filters
  const filteredData = React.useMemo(() => {
    let filtered = incidents;
    
    // Apply quick filter
    if (quickFilter === 'critical') {
      filtered = filtered.filter(item => {
        const deadline = getAEPDDeadlineStatus(
          item.latestVersion?.fechaDeteccion,
          item.latestVersion?.notificadoAEPD
        );
        return deadline && (deadline.status === 'critical' || deadline.status === 'overdue');
      });
    } else if (quickFilter === 'resolved') {
      filtered = filtered.filter(item => item.latestVersion?.fechaResolucion !== null);
    } else if (quickFilter === 'pending') {
      filtered = filtered.filter(item => 
        item.latestVersion && 
        (!item.latestVersion.notificadoAEPD || !item.latestVersion.notificadoAfectados)
      );
    }
    
    return filtered;
  }, [incidents, quickFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      
      // Search in incident ID
      const incidentId = row.original.incident.internalId.toString();
      if (incidentId.includes(searchValue)) return true;
      
      // Search in incident type
      const tipo = row.original.latestVersion?.tipoIncidente?.toLowerCase() || '';
      if (tipo.includes(searchValue)) return true;
      
      // Search in full description
      const descripcion = row.original.latestVersion?.descripcion?.toLowerCase() || '';
      if (descripcion.includes(searchValue)) return true;
      
      // Search in data categories
      const categorias = row.original.latestVersion?.categoriasDatos?.toLowerCase() || '';
      if (categorias.includes(searchValue)) return true;
      
      // Search in consequences
      const consecuencias = row.original.latestVersion?.consecuencias?.toLowerCase() || '';
      if (consecuencias.includes(searchValue)) return true;
      
      // Search in measures taken
      const medidas = row.original.latestVersion?.medidasAdoptadas?.toLowerCase() || '';
      if (medidas.includes(searchValue)) return true;
      
      return false;
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Apply additional filters
  React.useEffect(() => {
    if (statusFilter !== 'all') {
      table.getColumn('estado')?.setFilterValue(statusFilter);
    } else {
      table.getColumn('estado')?.setFilterValue(undefined);
    }
  }, [statusFilter, table]);

  React.useEffect(() => {
    if (notificationFilter !== 'all') {
      table.getColumn('notificaciones')?.setFilterValue(notificationFilter);
    } else {
      table.getColumn('notificaciones')?.setFilterValue(undefined);
    }
  }, [notificationFilter, table]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={quickFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={quickFilter === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('critical')}
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Críticos</span>
          </Button>
          <Button
            variant={quickFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('resolved')}
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Resueltos</span>
          </Button>
          <Button
            variant={quickFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('pending')}
          >
            <Clock className="mr-1 h-3 w-3" />
            <span className="hidden sm:inline">Pendientes</span>
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo, descripción, ID..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="in_progress">En proceso</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Todas las notificaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las notificaciones</SelectItem>
                  <SelectItem value="aepd">Notificado AEPD</SelectItem>
                  <SelectItem value="afectados">Notificado Afectados</SelectItem>
                  <SelectItem value="pending">Pendiente notificar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(globalFilter || statusFilter !== 'all' || notificationFilter !== 'all' || quickFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGlobalFilter('');
                  setStatusFilter('all');
                  setNotificationFilter('all');
                  setQuickFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Vista
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={table.getColumn('updatedAt')?.getIsVisible()}
                onCheckedChange={value => table.getColumn('updatedAt')?.toggleVisibility(!!value)}
              >
                Actualizado
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn('afectados')?.getIsVisible()}
                onCheckedChange={value => table.getColumn('afectados')?.toggleVisibility(!!value)}
              >
                Afectados
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn('plazoAEPD')?.getIsVisible()}
                onCheckedChange={value => table.getColumn('plazoAEPD')?.toggleVisibility(!!value)}
              >
                Plazo AEPD
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn('notificaciones')?.getIsVisible()}
                onCheckedChange={value => table.getColumn('notificaciones')?.toggleVisibility(!!value)}
              >
                Notificaciones
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table className="min-w-[768px]">
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead 
                        key={header.id} 
                        className={`${header.id === 'actions' ? 'text-right' : ''} ${
                          header.id === 'internalId' ? 'w-16 sm:w-20' :
                          header.id === 'tipoIncidente' ? 'w-auto min-w-[200px] sm:min-w-[300px]' :
                          header.id === 'fechaDeteccion' ? 'w-24 sm:w-28' :
                          header.id === 'estado' ? 'w-20 sm:w-24' :
                          header.id === 'plazoAEPD' ? 'w-24 sm:w-28' :
                          header.id === 'notificaciones' ? 'w-20 sm:w-24' :
                          header.id === 'afectados' ? 'w-16 sm:w-20' :
                          header.id === 'createdAt' ? 'w-24 sm:w-28' :
                          header.id === 'actions' ? 'w-16 sm:w-20' :
                          ''
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow 
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const isInteractive = target.closest('button, a, [role="menuitem"]');
                        if (!isInteractive) {
                          router.push(`/organizations/${organizationSlug}/incidents/${row.original.incident.id}`);
                        }
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell 
                          key={cell.id} 
                          className={`${cell.column.id === 'actions' ? 'text-right' : ''} ${
                            cell.column.id === 'internalId' ? 'w-16 sm:w-20' :
                            cell.column.id === 'tipoIncidente' ? 'w-auto min-w-[200px] sm:min-w-[300px]' :
                            cell.column.id === 'fechaDeteccion' ? 'w-24 sm:w-28' :
                            cell.column.id === 'estado' ? 'w-20 sm:w-24' :
                            cell.column.id === 'plazoAEPD' ? 'w-24 sm:w-28' :
                            cell.column.id === 'notificaciones' ? 'w-20 sm:w-24' :
                            cell.column.id === 'afectados' ? 'w-16 sm:w-20' :
                            cell.column.id === 'createdAt' ? 'w-24 sm:w-28' :
                            cell.column.id === 'actions' ? 'w-16 sm:w-20' :
                            ''
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No hay incidentes registrados</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                          Cuando registres tu primer incidente, aparecerá aquí
                        </p>
                        <Button 
                          onClick={() => router.push(`/organizations/${organizationSlug}/incidents/new`)}
                        >
                          Reportar Primer Incidente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              <span className="hidden sm:inline">
                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                de {table.getFilteredRowModel().rows.length} incidentes
              </span>
              <span className="sm:hidden">
                {table.getFilteredRowModel().rows.length} incidentes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">←</span>
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  <span className="hidden sm:inline">Página</span> {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">→</span>
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar incidente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el incidente y todas sus versiones del registro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteIncident}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
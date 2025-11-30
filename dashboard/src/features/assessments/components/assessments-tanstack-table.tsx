'use client';

import * as React from 'react';
import {  useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Eye,
  X,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  FileText,
  ClipboardCheck,
  Target,
  Shield,
  Settings,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@workspace/ui/components/sonner';
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
import { Progress } from '@workspace/ui/components/progress';

interface Assessment {
  id: string;
  organizationId: string;
  userId: string;
  testData: unknown;
  scorePersonas: number | null;
  scoreProcesos: number | null;
  scoreSistemas: number | null;
  scoreTotal: number | null;
  sector: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AssessmentsTanstackTableProps {
  assessments: Assessment[];
  organizationSlug: string;
  locale?: string;
  translations?: Record<string, string>;
}

function getScoreColor(score: number | null) {
  if (!score) return 'text-gray-400';
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBadge(score: number | null) {
  if (!score) return { label: 'N/A', color: 'bg-gray-500 text-white dark:bg-gray-900/60 dark:text-gray-200' };
  if (score >= 80) return { label: 'Excelente', color: 'bg-green-500 text-white dark:bg-green-900/60 dark:text-green-200' };
  if (score >= 60) return { label: 'Bueno', color: 'bg-yellow-500 text-white dark:bg-yellow-900/60 dark:text-yellow-200' };
  if (score >= 40) return { label: 'Regular', color: 'bg-orange-500 text-white dark:bg-orange-900/60 dark:text-orange-200' };
  return { label: 'Bajo', color: 'bg-red-500 text-white dark:bg-red-900/60 dark:text-red-200' };
}

function getTrendIndicator(current: Assessment, previous: Assessment | null) {
  if (!previous || !current.scoreTotal || !previous.scoreTotal) return null;

  const diff = current.scoreTotal - previous.scoreTotal;
  if (diff > 0) {
    return {
      icon: <TrendingUp className="h-3 w-3" />,
      color: 'text-green-600',
      label: `+${diff}%`,
    };
  }
  if (diff < 0) {
    return {
      icon: <TrendingDown className="h-3 w-3" />,
      color: 'text-red-600',
      label: `${diff}%`,
    };
  }
  return null;
}

export function AssessmentsTanstackTable({ assessments, organizationSlug, locale: _locale, translations: _translations }: AssessmentsTanstackTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    sector: false,
    updatedAt: false,
  });
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [scoreFilter, setScoreFilter] = React.useState<string>('all');

  const handleExportPDF = async (_assessmentId: string) => {
    try {
      // TODO: Implement PDF export
      toast.success('Exportando evaluación a PDF...');
    } catch (_error) {
      toast.error('Error al exportar PDF');
    }
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = ['Fecha', 'Personas', 'Procesos', 'Sistemas', 'Total', 'Sector'];
      const rows = assessments.map(a => [
        format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm'),
        a.scorePersonas,
        a.scoreProcesos,
        a.scoreSistemas,
        a.scoreTotal,
        a.sector || 'N/A'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluaciones-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      
      toast.success('Datos exportados correctamente');
    } catch (_error) {
      toast.error('Error al exportar datos');
    }
  };

  const columns = React.useMemo<ColumnDef<Assessment>[]>(() => [
    {
      id: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Fecha
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.createdAt,
      sortingFn: 'datetime',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), 'HH:mm', { locale: es })}
          </p>
        </div>
      ),
    },
    {
      id: 'scores',
      header: () => <span>Puntuaciones por Área</span>,
      cell: ({ row }) => {
        const assessment = row.original;
        const scoreBadge = getScoreBadge(assessment.scoreTotal);
        const previousAssessment = assessments[assessments.indexOf(assessment) + 1] || null;
        const trend = getTrendIndicator(assessment, previousAssessment);
        
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="w-24">
                      <Progress value={assessment.scorePersonas} className="h-2" />
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(assessment.scorePersonas)}`}>
                      {assessment.scorePersonas}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <div className="w-24">
                      <Progress value={assessment.scoreProcesos} className="h-2" />
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(assessment.scoreProcesos)}`}>
                      {assessment.scoreProcesos}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div className="w-24">
                      <Progress value={assessment.scoreSistemas} className="h-2" />
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(assessment.scoreSistemas)}`}>
                      {assessment.scoreSistemas}%
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Detalles de Evaluación</h4>
                  <Badge className={scoreBadge.color}>
                    {scoreBadge.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Personas
                    </span>
                    <span className={`font-medium ${getScoreColor(assessment.scorePersonas)}`}>
                      {assessment.scorePersonas}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Settings className="h-3 w-3" /> Procesos
                    </span>
                    <span className={`font-medium ${getScoreColor(assessment.scoreProcesos)}`}>
                      {assessment.scoreProcesos}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Sistemas
                    </span>
                    <span className={`font-medium ${getScoreColor(assessment.scoreSistemas)}`}>
                      {assessment.scoreSistemas}%
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Puntuación Total</span>
                    <span className={`text-lg font-bold ${getScoreColor(assessment.scoreTotal)}`}>
                      {assessment.scoreTotal}%
                    </span>
                  </div>
                  {trend && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`flex items-center gap-1 text-xs ${trend.color}`}>
                        {trend.icon}
                        {trend.label} vs. evaluación anterior
                      </span>
                    </div>
                  )}
                </div>
                
                {assessment.sector && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Sector: {assessment.sector}</span>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      id: 'scoreTotal',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Puntuación Total
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      accessorFn: row => row.scoreTotal,
      cell: ({ row }) => {
        const score = row.original.scoreTotal;
        const badge = getScoreBadge(score);
        const previousAssessment = assessments[assessments.indexOf(row.original) + 1] || null;
        const trend = getTrendIndicator(row.original, previousAssessment);
        
        return (
          <div className="flex items-center gap-2">
            <Badge className={badge.color}>
              <Target className="mr-1 h-3 w-3" />
              {score}%
            </Badge>
            {trend && (
              <span className={`flex items-center gap-1 text-xs ${trend.color}`}>
                {trend.icon}
                {trend.label}
              </span>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        const score = row.getValue(id) as number;
        if (value === 'excellent') return score >= 80;
        if (value === 'good') return score >= 60 && score < 80;
        if (value === 'regular') return score >= 40 && score < 60;
        if (value === 'low') return score < 40;
        return true;
      },
    },
    {
      id: 'status',
      header: () => <span>Estado</span>,
      cell: ({ row, table }) => {
        const currentIndex = table.getSortedRowModel().rows.indexOf(row);
        const isLatest = currentIndex === 0;
        const assessment = row.original;
        const badge = getScoreBadge(assessment.scoreTotal);
        
        return (
          <div className="flex items-center gap-2">
            {isLatest && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Más reciente
              </Badge>
            )}
            <Badge variant="outline" className={badge.color.replace('bg-', 'text-').replace('500', '600')}>
              {badge.label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'sector',
      header: () => <span>Sector</span>,
      accessorFn: row => row.sector,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sector || 'No especificado'}
        </span>
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
      accessorFn: row => row.updatedAt,
      sortingFn: 'datetime',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.updatedAt), 'dd/MM/yyyy', { locale: es })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const assessment = row.original;
        
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* View button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/organizations/${organizationSlug}/assessments/${assessment.id}`)}
                  className="h-8 w-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver respuestas</TooltipContent>
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
                  onClick={() => router.push(`/organizations/${organizationSlug}/assessments/${assessment.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver respuestas detalladas
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => router.push(`/organizations/${organizationSlug}/assessments/${assessment.id}/report`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver informe
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => router.push(`/organizations/${organizationSlug}/assessments/${assessment.id}/compare`)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Comparar con anterior
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={() => handleExportPDF(assessment.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [organizationSlug, router, assessments]);

  const table = useReactTable({
    data: assessments,
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
      
      // Search in sector
      const sector = row.original.sector?.toLowerCase() || '';
      if (sector.includes(searchValue)) return true;
      
      // Search in date
      const date = format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: es }).toLowerCase();
      if (date.includes(searchValue)) return true;
      
      // Search in scores
      const scores = `${row.original.scoreTotal} ${row.original.scorePersonas} ${row.original.scoreProcesos} ${row.original.scoreSistemas}`;
      if (scores.includes(searchValue)) return true;
      
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
        pageSize: 10,
      },
    },
  });

  // Apply score filter
  React.useEffect(() => {
    if (scoreFilter !== 'all') {
      table.getColumn('scoreTotal')?.setFilterValue(scoreFilter);
    } else {
      table.getColumn('scoreTotal')?.setFilterValue(undefined);
    }
  }, [scoreFilter, table]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 w-full max-w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por fecha, sector..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas las puntuaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las puntuaciones</SelectItem>
                <SelectItem value="excellent">Excelente (80-100)</SelectItem>
                <SelectItem value="good">Bueno (60-79)</SelectItem>
                <SelectItem value="regular">Regular (40-59)</SelectItem>
                <SelectItem value="low">Bajo (0-39)</SelectItem>
              </SelectContent>
            </Select>

            {(globalFilter || scoreFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  setGlobalFilter('');
                  setScoreFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="sm:inline">Vista</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={table.getColumn('sector')?.getIsVisible()}
                  onCheckedChange={value => table.getColumn('sector')?.toggleVisibility(!!value)}
                >
                  Sector
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={table.getColumn('updatedAt')?.getIsVisible()}
                  onCheckedChange={value => table.getColumn('updatedAt')?.toggleVisibility(!!value)}
                >
                  Actualizado
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                    <TableHead key={header.id} className={header.id === 'actions' ? 'text-right w-[100px]' : ''}>
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
                        router.push(`/organizations/${organizationSlug}/assessments/${row.original.id}`);
                      }
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'text-right' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No hay evaluaciones registradas</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Realiza tu primera evaluación de ciberseguridad
                      </p>
                      <Button 
                        onClick={() => router.push(`/organizations/${organizationSlug}/assessments/new`)}
                      >
                        Nueva Evaluación
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
                de {table.getFilteredRowModel().rows.length} evaluaciones
              </span>
              <span className="sm:hidden">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )} de {table.getFilteredRowModel().rows.length}
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
                <span className="sm:hidden">Ant.</span>
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm whitespace-nowrap">
                  <span className="hidden sm:inline">Página </span>
                  {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">Sig.</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, MoreHorizontal, Eye, Edit2, Copy } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

import { ScoreBadge } from './score-badge';
import { ColumnToggle } from './column-toggle';
import { DeleteAssessmentButton } from './delete-assessment-button';
import { type CIS18Assessment, CIS18ControlNames } from '../types/cis18-types';
import { exportToCSV, exportToExcel } from '../utils/export-utils';

interface CIS18DataTableProps {
  data: CIS18Assessment[];
  userId?: string;
  organizationSlug?: string;
}

export function CIS18DataTable({ data, userId, organizationSlug }: CIS18DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();

  const controlNames = CIS18ControlNames;

  // Load column preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem(`cis18-columns-${userId}`);
    if (savedPreferences) {
      try {
        setColumnVisibility(JSON.parse(savedPreferences));
      } catch (_e) {
        // Set default visibility if parse fails
        setDefaultVisibility();
      }
    } else {
      setDefaultVisibility();
    }
  }, [userId]);

  // Save column preferences to localStorage
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`cis18-columns-${userId}`, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, userId]);

  const setDefaultVisibility = () => {
    const defaultVisible: VisibilityState = {
      control1: true,
      control2: true,
      control3: true,
      control4: true,
      control5: true,
      control6: true,
      control7: false,
      control8: false,
      control9: false,
      control10: false,
      control11: false,
      control12: false,
      control13: false,
      control14: false,
      control15: false,
      control16: false,
      control17: false,
      control18: false,
      totalScore: true,
    };
    setColumnVisibility(defaultVisible);
  };

  // Define columns
  const columns: ColumnDef<CIS18Assessment>[] = [
    {
      accessorKey: 'organizationId',
      header: 'Organización',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.organizationId.slice(0, 8)}...
        </div>
      ),
      enableHiding: false, // Always show organization column
    },
    ...Array.from({ length: 18 }, (_, i) => {
      const controlKey = `control${i + 1}` as keyof CIS18Assessment;
      const controlName = controlNames[controlKey];
      
      return {
        accessorKey: controlKey,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-2"
          >
            CIS-{i + 1}
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const score = row.getValue(controlKey) as number | null;
          return (
            <div className="text-center">
              <ScoreBadge score={score} />
              <div className="text-xs text-muted-foreground mt-1 max-w-[100px] truncate" title={controlName}>
                {controlName}
              </div>
            </div>
          );
        },
        enableSorting: true,
      } as ColumnDef<CIS18Assessment>;
    }),
    {
      accessorKey: 'totalScore',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-2 font-semibold"
        >
          Total
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.getValue('totalScore') as number | null;
        return (
          <div className="text-center">
            <ScoreBadge score={score} className="font-semibold" />
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'assessmentDate',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = row.getValue('assessmentDate') as Date;
        return new Date(date).toLocaleDateString('es-ES');
      },
      enableHiding: false, // Always show date
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => organizationSlug && router.push(`/organizations/${organizationSlug}/cis-18/${assessment.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(assessment.id);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar ID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DeleteAssessmentButton
              assessmentId={assessment.id}
              assessmentDate={assessment.assessmentDate}
            />
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExportCSV = () => {
    exportToCSV(data, table.getVisibleFlatColumns());
  };

  const handleExportExcel = () => {
    exportToExcel(data, table.getVisibleFlatColumns());
  };

  return (
    <div className="space-y-4">
      {/* Table Actions */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <ColumnToggle table={table} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                Exportar como Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className={`text-center min-w-[100px] ${
                      header.column.id === 'organizationId' ? 'bg-background' : ''
                    }`}
                    style={{
                      position: header.column.id === 'organizationId' ? 'sticky' : undefined,
                      left: header.column.id === 'organizationId' ? 0 : undefined,
                      zIndex: header.column.id === 'organizationId' ? 1 : undefined,
                    }}
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={(e) => {
                    // Don't navigate if clicking on actions column
                    const target = e.target as HTMLElement;
                    if (!target.closest('[data-column-id="actions"]') && organizationSlug) {
                      router.push(`/organizations/${organizationSlug}/cis-18/${row.original.id}`);
                    }
                  }}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={`text-center ${
                        cell.column.id === 'organizationId' ? 'bg-background' : ''
                      }`}
                      data-column-id={cell.column.id}
                      style={{
                        position: cell.column.id === 'organizationId' ? 'sticky' : undefined,
                        left: cell.column.id === 'organizationId' ? 0 : undefined,
                        zIndex: cell.column.id === 'organizationId' ? 1 : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {table.getFilteredRowModel().rows.length} de {data.length} registros
        </div>
        <div>
          {table.getVisibleFlatColumns().filter(col => col.id.startsWith('control')).length} de 18 controles visibles
        </div>
      </div>
    </div>
  );
}
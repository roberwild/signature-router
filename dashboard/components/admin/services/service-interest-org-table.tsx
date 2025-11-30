'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users,
  Clock,
  Mail,
  Phone,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Input } from '@workspace/ui/components/input';

interface ServiceDetail {
  serviceName: string;
  serviceType?: string | null;
  clickCount: number;
  lastClick?: Date | null;
}

interface OrganizationClick {
  organizationId: string;
  organizationName?: string | null;
  organizationSlug?: string | null;
  organizationPhone?: string | null;
  clickCount: number;
  uniqueUsers: number;
  lastClickedAt?: Date | null;
  lastUserName?: string | null;
  lastUserEmail?: string | null;
  serviceDetails?: ServiceDetail[];
  leadScore?: number | null;
  leadCategory?: string | null;
}

interface ServiceInterestOrgTableProps {
  organizations: OrganizationClick[];
}

// Classification color helper
const getClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'A1':
      return 'destructive';
    case 'A2':
      return 'destructive';
    case 'B1':
      return 'warning';
    case 'B2':
      return 'warning';
    case 'C1':
      return 'default';
    case 'C2':
      return 'default';
    case 'D1':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export function ServiceInterestOrgTable({ organizations }: ServiceInterestOrgTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'clickCount', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo<ColumnDef<OrganizationClick>[]>(() => [
    {
      accessorKey: 'organizationName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Organization
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.organizationName || 'Unknown Organization'}
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.lastUserEmail && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {row.original.lastUserEmail}
            </div>
          )}
          {row.original.organizationPhone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3" />
              {row.original.organizationPhone}
            </div>
          )}
          {!row.original.lastUserEmail && !row.original.organizationPhone && (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'clickCount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Total Clicks
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.getValue('clickCount')}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'uniqueUsers',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Unique Users
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="h-3 w-3" />
          <span>{row.getValue('uniqueUsers')}</span>
        </div>
      ),
    },
    {
      id: 'leadScore',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Lead Score
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => {
        const score = row.original.leadScore;
        const category = row.original.leadCategory;
        
        if (!score) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={getClassificationColor(category || '') as "default" | "secondary" | "destructive" | "outline" | undefined}>
              {category}
            </Badge>
            <span className="text-sm font-medium">{score}</span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'services',
      header: 'Services Interested In',
      cell: ({ row }) => {
        const services = row.original.serviceDetails || [];
        
        if (services.length === 0) {
          return <span className="text-sm text-muted-foreground">No services</span>;
        }
        
        return (
          <div className="space-y-1 max-w-md">
            {services.slice(0, 3).map((service, index) => (
              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {service.serviceName}
                  </Badge>
                  <span className="text-muted-foreground">
                    ({service.clickCount} clicks)
                  </span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {service.lastClick ? format(new Date(service.lastClick), 'dd/MM HH:mm', { locale: es }) : '-'}
                </span>
              </div>
            ))}
            {services.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{services.length - 3} more services
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lastClickedAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Last Activity
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('lastClickedAt') as Date | null;
        return (
          <div className="flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {date ? format(new Date(date), 'dd/MM HH:mm', { locale: es }) : '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const org = row.original;
        
        if (!org.organizationSlug) return null;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => router.push(`/admin/users?organization=${org.organizationSlug}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Organization
              </DropdownMenuItem>
              {org.lastUserEmail && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`mailto:${org.lastUserEmail}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Contact
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [router]);

  const table = useReactTable({
    data: organizations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: 'includesString',
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search organizations..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No organization interaction data available yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            organizations.length
          )}{' '}
          of {organizations.length} organizations
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
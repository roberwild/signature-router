'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Eye,
  CheckCircle,
  UserCheck,
  Clock,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

interface ServiceRequest {
  id: string;
  createdAt: Date;
  serviceName: string | null;
  serviceType?: string | null;
  organizationName: string | null;
  userName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone?: string | null;
  status: string;
  leadScore?: number | null;
  leadClassification?: string | null;
}

interface ServiceRequestsTableProps {
  requests: ServiceRequest[];
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800'
  },
  contacted: { 
    label: 'Contactado', 
    color: 'bg-blue-100 text-blue-800'
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'bg-orange-100 text-orange-800'
  },
  completed: { 
    label: 'Completado', 
    color: 'bg-green-100 text-green-800'
  }
};

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
    default:
      return 'secondary';
  }
};

export function ServiceRequestsTable({ 
  requests
}: ServiceRequestsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo<ColumnDef<ServiceRequest>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Date
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      id: 'service',
      accessorKey: 'serviceName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Service
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.serviceName || 'No service name'}</div>
          {row.original.serviceType && (
            <div className="text-xs text-muted-foreground">{row.original.serviceType}</div>
          )}
        </div>
      ),
    },
    {
      id: 'organization',
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
        <div>
          <div className="font-medium">{row.original.organizationName || 'No organization'}</div>
          <div className="text-xs text-muted-foreground">{row.original.userName}</div>
        </div>
      ),
      filterFn: (row, id, value) => {
        const orgName = row.original.organizationName || '';
        const userName = row.original.userName || '';
        return orgName.toLowerCase().includes(value.toLowerCase()) ||
               userName.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3" />
            {row.original.contactEmail || 'No email'}
          </div>
          {row.original.contactPhone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3" />
              {row.original.contactPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'leadScore',
      header: 'Lead Score',
      cell: ({ row }) => {
        if (!row.original.leadScore) {
          return <span className="text-sm text-muted-foreground">No lead data</span>;
        }
        
        const color = row.original.leadClassification 
          ? getClassificationColor(row.original.leadClassification) 
          : 'secondary';
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={color as "default" | "secondary" | "destructive" | "outline" | undefined}>
              {row.original.leadClassification}
            </Badge>
            <span className="text-sm font-medium">{row.original.leadScore}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8"
          >
            Status
            {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = statusConfig[row.getValue('status') as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge className={status.color}>{status.label}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: 'actions',
      header: 'Quick Actions',
      cell: ({ row }) => {
        const request = row.original;
        
        return (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {request.contactPhone && (
              <Button size="sm" variant="outline" asChild title="Contact via WhatsApp">
                <a
                  href={`https://wa.me/${request.contactPhone.replace(/\D/g, '')}?text=Hola ${request.contactName || 'there'}, somos de Minery Guard. Recibimos tu solicitud de ${request.serviceName || 'service'}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* View Actions */}
                <DropdownMenuItem onClick={() => router.push(`/es/admin/services/${request.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/es/admin/services/${request.id}#documents`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Status Actions */}
                <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                {request.status !== 'contacted' && (
                  <DropdownMenuItem 
                    onClick={async () => {
                      // Quick status update to 'contacted'
                      const response = await fetch(`/api/admin/services/${request.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'contacted' })
                      });
                      if (response.ok) {
                        router.refresh();
                      }
                    }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Mark as Contacted
                  </DropdownMenuItem>
                )}
                {request.status !== 'in-progress' && (
                  <DropdownMenuItem 
                    onClick={async () => {
                      // Quick status update to 'in-progress'
                      const response = await fetch(`/api/admin/services/${request.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'in-progress' })
                      });
                      if (response.ok) {
                        router.refresh();
                      }
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as In Progress
                  </DropdownMenuItem>
                )}
                {request.status !== 'completed' && (
                  <DropdownMenuItem 
                    onClick={async () => {
                      // Quick status update to 'completed'
                      const response = await fetch(`/api/admin/services/${request.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'completed' })
                      });
                      if (response.ok) {
                        router.refresh();
                      }
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* Communication Actions */}
                <DropdownMenuLabel className="text-xs">Communication</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <a href={`mailto:${request.contactEmail || ''}?subject=Re: ${request.serviceName || 'Service Request'} - Minery Guard`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </a>
                </DropdownMenuItem>
                {request.contactPhone && (
                  <DropdownMenuItem asChild>
                    <a 
                      href={`tel:${request.contactPhone}`}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Contact
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push(`/es/admin/services/${request.id}?tab=conversation`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Add Admin Note
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Delete Action with Confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive hover:text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Request
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Service Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this service request from {request.contactName || 'this contact'}?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/services/${request.id}`, {
                              method: 'DELETE',
                            });
                            
                            if (response.ok) {
                              router.refresh();
                            } else {
                              console.error('Failed to delete service request');
                            }
                          } catch (error) {
                            console.error('Error deleting service request:', error);
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [router]);

  const table = useReactTable({
    data: requests,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search requests..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={
              (table.getColumn('status')?.getFilterValue() as string[])?.join(',') || 'all'
            }
            onValueChange={(value) => {
              if (value === 'all') {
                table.getColumn('status')?.setFilterValue(undefined);
              } else {
                table.getColumn('status')?.setFilterValue(value.split(','));
              }
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                  onClick={() => router.push(`/es/admin/services/${row.original.id}`)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                  No service requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
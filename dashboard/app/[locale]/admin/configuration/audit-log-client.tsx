'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, History } from 'lucide-react';
type DateRange = { from?: Date; to?: Date };
import { Button } from '@workspace/ui/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination';
import { AuditLogTable } from './components/audit-log-table';
import { AuditLogFilters } from './components/audit-log-filters';
import { toast } from 'sonner';
import { ActionType } from './types';

export interface ConfigAuditLogEntry {
  id: string;
  action: ActionType;
  config_key: string | null;
  previous_value: string | null;
  new_value: string | null;
  is_sensitive: boolean | null;
  changed_at: Date | string;
  changed_by: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

interface AuditLogClientProps {
  initialLogs: ConfigAuditLogEntry[];
  users: Array<{ id: string; name: string; email: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AuditLogClient({ initialLogs, users, pagination: initialPagination }: AuditLogClientProps) {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<ConfigAuditLogEntry[]>(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: undefined as DateRange | undefined,
    userId: searchParams.get('userId') || '',
    configKey: searchParams.get('configKey') || '',
  });

  const fetchLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pagination.limit.toString());
    
    if (filters.dateRange?.from) {
      params.set('startDate', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      params.set('endDate', filters.dateRange.to.toISOString());
    }
    if (filters.userId) {
      params.set('userId', filters.userId);
    }
    if (filters.configKey) {
      params.set('configKey', filters.configKey);
    }

    try {
      const response = await fetch(`/api/admin/config/audit?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  const handleFiltersChange = (newFilters: {
    dateRange?: DateRange;
    userId?: string;
    configKey?: string;
  }) => {
    setFilters({
      dateRange: newFilters.dateRange,
      userId: newFilters.userId || '',
      configKey: newFilters.configKey || ''
    });
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  const exportToCSV = async () => {
    try {
      // Fetch all logs without pagination
      const params = new URLSearchParams();
      params.set('limit', '10000'); // Large number to get all
      
      if (filters.dateRange?.from) {
        params.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        params.set('endDate', filters.dateRange.to.toISOString());
      }
      if (filters.userId) {
        params.set('userId', filters.userId);
      }
      if (filters.configKey) {
        params.set('configKey', filters.configKey);
      }

      const response = await fetch(`/api/admin/config/audit?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      const allLogs = data.data;

      // Create CSV content
      const headers = ['Timestamp', 'User', 'Email', 'Key', 'Action', 'Previous Value', 'New Value'];
      const rows = allLogs.map((log: ConfigAuditLogEntry) => [
        new Date(log.changed_at).toISOString(),
        log.user?.name || 'System',
        log.user?.email || '',
        log.config_key,
        log.action,
        log.is_sensitive ? '***' : (log.previous_value || ''),
        log.is_sensitive ? '***' : (log.new_value || '')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: unknown[]) => row.map((cell: unknown) => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `config-audit-log-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Audit log exported successfully');
    } catch (error) {
      toast.error('Failed to export audit log');
      console.error(error);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchLogs(1);
  }, [filters, fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Audit History</h3>
          <span className="text-sm text-muted-foreground">
            ({pagination.total} total entries)
          </span>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <AuditLogFilters
        users={users}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <AuditLogTable logs={logs} isLoading={isLoading} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pagination.page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {pagination.totalPages > 5 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
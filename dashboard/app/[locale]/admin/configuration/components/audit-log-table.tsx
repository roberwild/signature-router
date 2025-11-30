'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/scroll-area';
import { ConfigAuditLogEntry } from '../audit-log-client';
import { ActionType } from '../types';

interface AuditLogTableProps {
  logs: ConfigAuditLogEntry[];
  isLoading?: boolean;
}

const actionVariants = {
  [ActionType.CREATE]: 'default',
  [ActionType.UPDATE]: 'secondary',
  [ActionType.DELETE]: 'destructive'
} as const;

const actionLabels = {
  [ActionType.CREATE]: 'Created',
  [ActionType.UPDATE]: 'Updated',
  [ActionType.DELETE]: 'Deleted'
};

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  const maskValue = (value: string | null, is_sensitive: boolean | null) => {
    if (!value) return '-';
    return is_sensitive ? '••••••••' : value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading audit logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">No audit logs found</p>
        <p className="text-sm text-muted-foreground">
          Configuration changes will appear here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead className="w-[200px]">Configuration Key</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead>Previous Value</TableHead>
            <TableHead>New Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm">
                {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
              </TableCell>
              <TableCell>
                {log.user ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={log.user.image || undefined} alt={log.user.name} />
                      <AvatarFallback className="text-xs">
                        {log.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{log.user.name}</span>
                      <span className="text-xs text-muted-foreground">{log.user.email}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">System</span>
                )}
              </TableCell>
              <TableCell>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {log.config_key || 'N/A'}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={actionVariants[log.action] as 'default' | 'secondary' | 'destructive'}>
                  {actionLabels[log.action]}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <span className="text-sm font-mono text-muted-foreground truncate block">
                  {maskValue(log.previous_value, log.is_sensitive)}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <span className="text-sm font-mono text-muted-foreground truncate block">
                  {maskValue(log.new_value, log.is_sensitive)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
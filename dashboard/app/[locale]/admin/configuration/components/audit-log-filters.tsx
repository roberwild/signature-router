'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { cn } from '@workspace/ui/lib/utils';

interface AuditLogFiltersProps {
  users: Array<{ id: string; name: string; email: string }>;
  onFiltersChange: (filters: {
    dateRange?: DateRange;
    userId?: string;
    configKey?: string;
  }) => void;
}

export function AuditLogFilters({ users, onFiltersChange }: AuditLogFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [configKey, setConfigKey] = useState('');

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    applyFilters({ dateRange: range });
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    applyFilters({ userId: userId || undefined });
  };

  const handleKeyChange = (key: string) => {
    setConfigKey(key);
    applyFilters({ configKey: key || undefined });
  };

  const applyFilters = (updates: Partial<{
    dateRange?: DateRange;
    userId?: string;
    configKey?: string;
  }>) => {
    onFiltersChange({
      dateRange: updates.dateRange !== undefined ? updates.dateRange : dateRange,
      userId: updates.userId !== undefined ? updates.userId : selectedUser || undefined,
      configKey: updates.configKey !== undefined ? updates.configKey : configKey || undefined,
    });
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedUser('');
    setConfigKey('');
    onFiltersChange({});
  };

  const hasActiveFilters = dateRange || selectedUser || configKey;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd/MM/yyyy', { locale: es })} -{' '}
                  {format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
                </>
              ) : (
                format(dateRange.from, 'dd/MM/yyyy', { locale: es })
              )
            ) : (
              'Select date range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>

      {/* User Filter */}
      <Select value={selectedUser} onValueChange={handleUserChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Config Key Filter */}
      <Input
        placeholder="Search by key..."
        value={configKey}
        onChange={(e) => handleKeyChange(e.target.value)}
        className="w-[200px]"
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
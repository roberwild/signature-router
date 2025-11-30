'use client';

import { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';

interface ColumnToggleProps<TData> {
  table: Table<TData>;
}

export function ColumnToggle<TData>({ table }: ColumnToggleProps<TData>) {
  const allColumns = table.getAllColumns()
    .filter((column) => column.getCanHide());

  const controlColumns = allColumns.filter(col => 
    col.id.startsWith('control') && !col.id.includes('total')
  );
  
  const handleSelectAll = () => {
    allColumns.forEach(column => column.toggleVisibility(true));
  };

  const handleDeselectAll = () => {
    allColumns.forEach(column => column.toggleVisibility(false));
  };

  const handleResetDefaults = () => {
    // Show controls 1-6 and total score by default
    allColumns.forEach(column => {
      const shouldShow = 
        column.id === 'totalScore' ||
        ['control1', 'control2', 'control3', 'control4', 'control5', 'control6'].includes(column.id);
      column.toggleVisibility(shouldShow);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Settings2 className="mr-2 h-4 w-4" />
          Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Mostrar Columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleSelectAll}
          >
            Seleccionar todas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleDeselectAll}
          >
            Deseleccionar todas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleResetDefaults}
          >
            Restablecer por defecto
          </Button>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Total Score */}
        {table.getColumn('totalScore') && (
          <>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('totalScore')?.getIsVisible()}
              onCheckedChange={(value) =>
                table.getColumn('totalScore')?.toggleVisibility(!!value)
              }
              className="font-semibold"
            >
              Puntuación Total
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Control Columns */}
        {controlColumns.map((column) => {
          const controlNum = column.id.replace('control', '');
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              CIS-{controlNum}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
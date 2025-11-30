'use client';

import { useState } from 'react';
import { LayoutGrid, Table2, GitCompare } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { CIS18AssessmentCards } from './cis18-assessment-cards';
import { CIS18DataTable } from './cis18-data-table';
import { CIS18ComparisonView } from './cis18-comparison-view';
import { type CIS18Assessment } from '../types/cis18-types';

interface CIS18ViewToggleProps {
  data: CIS18Assessment[];
  organizationSlug?: string;
  userId?: string;
}

export function CIS18ViewToggle({ data, organizationSlug, userId }: CIS18ViewToggleProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'comparison'>('cards');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Evaluaciones</h2>
          <p className="text-muted-foreground">
            Resultados de las auditorías CIS-18 realizadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Tarjetas
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table2 className="mr-2 h-4 w-4" />
            Tabla
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('comparison')}
            disabled={data.length < 2}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Comparar
          </Button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <CIS18AssessmentCards 
          data={data}
          organizationSlug={organizationSlug}
        />
      ) : viewMode === 'table' ? (
        <CIS18DataTable 
          data={data}
          userId={userId}
          organizationSlug={organizationSlug}
        />
      ) : (
        <CIS18ComparisonView 
          assessments={data}
        />
      )}
    </div>
  );
}
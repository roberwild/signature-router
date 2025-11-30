'use client';

import * as React from 'react';
import { Progress } from '@workspace/ui/components/progress';
import { Badge } from '@workspace/ui/components/badge';

import type { ProgressIndicatorProps } from './types';

export function ProgressIndicator({
  current,
  total,
  label = 'Progress',
  showPercentage = true
}: ProgressIndicatorProps): React.JSX.Element {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {label}: {current} de {total}
        </span>
        {showPercentage && (
          <Badge variant={progress === 100 ? 'default' : 'secondary'}>
            {Math.round(progress)}% completado
          </Badge>
        )}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
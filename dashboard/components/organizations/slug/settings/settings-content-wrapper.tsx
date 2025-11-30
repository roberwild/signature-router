import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

export interface SettingsContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsContentWrapper({
  children,
  className
}: SettingsContentWrapperProps): React.JSX.Element {
  return (
    <div className={cn('mx-auto max-w-4xl px-6 py-8', className)}>
      {children}
    </div>
  );
}
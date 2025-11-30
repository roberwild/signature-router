'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@workspace/ui/components/alert';
import { LucideIcon, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface AlertWithIconProps {
  icon: LucideIcon;
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

/**
 * Alert component with proper icon spacing according to Claude.md guidelines
 * 
 * Automatically applies:
 * - ml-6 mt-1 to AlertTitle (prevents icon overlap)
 * - mt-1 to AlertDescription (consistent spacing)
 * 
 * Usage:
 * <AlertWithIcon 
 *   icon={Bell} 
 *   title="Important Notice"
 *   description="This is an important message for users."
 * />
 */
export function AlertWithIcon({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: AlertWithIconProps) {
  return (
    <Alert variant={variant} className={className}>
      <Icon className={cn('h-4 w-4', iconClassName)} />
      <div>
        {title && (
          <AlertTitle className={cn('ml-6 mt-1', titleClassName)}>
            {title}
          </AlertTitle>
        )}
        <AlertDescription className={cn(title ? 'mt-1' : 'ml-6 mt-1', descriptionClassName)}>
          {description}
        </AlertDescription>
      </div>
    </Alert>
  );
}

/**
 * Quick alert variants for common use cases
 */
export const InfoAlert = ({ title, description, className }: { title?: string; description: string; className?: string }) => (
  <AlertWithIcon
    icon={Info}
    title={title}
    description={description}
    className={cn('bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50', className)}
  />
);

export const WarningAlert = ({ title, description, className }: { title?: string; description: string; className?: string }) => (
  <AlertWithIcon
    icon={AlertTriangle}
    title={title}
    description={description}
    className={cn('bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50', className)}
  />
);

export const ErrorAlert = ({ title, description, className }: { title?: string; description: string; className?: string }) => (
  <AlertWithIcon
    icon={AlertCircle}
    title={title}
    description={description}
    variant="destructive"
    className={className}
  />
);

export const SuccessAlert = ({ title, description, className }: { title?: string; description: string; className?: string }) => (
  <AlertWithIcon
    icon={CheckCircle2}
    title={title}
    description={description}
    className={cn('bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50 text-green-800 dark:text-green-200', className)}
    iconClassName="text-green-600"
  />
);
'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Skeleton Components
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton = memo<SkeletonProps>(({ 
  className, 
  width, 
  height 
}) => (
  <div 
    className={cn(
      'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
      className
    )}
    style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height 
    }}
  />
));

Skeleton.displayName = 'Skeleton';

// Card Skeleton
export const CardSkeleton = memo(() => (
  <div className="p-6 space-y-4 border rounded-lg">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Table Skeleton
interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export const TableSkeleton = memo<TableSkeletonProps>(({ 
  columns = 4, 
  rows = 5 
}) => (
  <div className="w-full">
    {/* Table Header */}
    <div className="flex space-x-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            className="h-4 flex-1" 
          />
        ))}
      </div>
    ))}
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

// Form Skeleton
export const FormSkeleton = memo(() => (
  <div className="space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-2 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-16" />
    </div>
  </div>
));

FormSkeleton.displayName = 'FormSkeleton';

// Page Loading State
interface PageLoadingProps {
  title?: string;
  showBreadcrumb?: boolean;
}

export const PageLoading = memo<PageLoadingProps>(({
  title: _title = 'Loading...',
  showBreadcrumb = false
}) => (
  <div className="p-6">
    {showBreadcrumb && (
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <span className="text-slate-400">/</span>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )}
    
    <div className="mb-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
    
    <div className="grid gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
));

PageLoading.displayName = 'PageLoading';

// Button Loading State
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const LoadingButton = memo<LoadingButtonProps>(({
  loading = false,
  children,
  disabled,
  className,
  size = 'md',
  onClick
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const spinnerSizes = {
    sm: 'sm' as const,
    md: 'sm' as const,
    lg: 'md' as const
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        'transition-colors',
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <LoadingSpinner 
          size={spinnerSizes[size]} 
          className="mr-2 text-current" 
        />
      )}
      {children}
    </button>
  );
});

LoadingButton.displayName = 'LoadingButton';

// Progress Bar
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export const ProgressBar = memo<ProgressBarProps>(({
  value,
  max = 100,
  className,
  showValue = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-slate-600 mb-1">
        <span>Progress</span>
        {showValue && <span>{Math.round(percentage)}%</span>}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const LoadingOverlay = memo<LoadingOverlayProps>(({
  isLoading,
  children,
  loadingText = 'Loading...',
  className
}) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {loadingText}
          </p>
        </div>
      </div>
    )}
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';
'use client';

import {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  Suspense,
  Component,
  ErrorInfo,
  ReactNode
} from 'react';
import { debounce } from 'lodash-es';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Skeleton } from '@workspace/ui/components/skeleton';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error for monitoring
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys && resetOnPropsChange) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }, 100);
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback 
          error={error} 
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

// Default Error Fallback Component
interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = memo<ErrorFallbackProps>(({ error, resetErrorBoundary }) => (
  <Alert className="m-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="mt-1">
      <div className="space-y-2">
        <p><strong>Something went wrong:</strong></p>
        <p className="text-sm text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetErrorBoundary}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </AlertDescription>
  </Alert>
));
ErrorFallback.displayName = 'ErrorFallback';

// Loading Skeleton Components
export const FormSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
));
FormSkeleton.displayName = 'FormSkeleton';

export const TableSkeleton = memo(({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <div className="flex space-x-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
));
TableSkeleton.displayName = 'TableSkeleton';

export const CardSkeleton = memo(() => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

// Memoized Input Component with Debouncing
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export const DebouncedInput = memo<DebouncedInputProps>(({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
  className,
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isFirstRender = useRef(true);

  // Debounced onChange handler
  const debouncedOnChange = useMemo(
    () => debounce((newValue: string) => {
      onChange(newValue);
    }, debounceMs),
    [onChange, debounceMs]
  );

  // Update local value when prop changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLocalValue(value);
  }, [value]);

  // Handle local input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
});
DebouncedInput.displayName = 'DebouncedInput';

// Virtualized List Component
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, visibleRange.start + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lazy Loading Wrapper
interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const LazyComponent = memo<LazyComponentProps>(({ 
  fallback = <Loader2 className="h-6 w-6 animate-spin" />, 
  children 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
));
LazyComponent.displayName = 'LazyComponent';

// Performance Optimized Data Table
interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: unknown, item: T, index: number) => ReactNode;
  }>;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    key: keyof T;
    direction: 'asc' | 'desc';
    onSort: (key: keyof T) => void;
  };
}

export function OptimizedDataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  sorting
}: OptimizedDataTableProps<T>) {
  // Memoize sorted data
  const sortedData = useMemo(() => {
    if (!sorting) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sorting.key];
      const bVal = b[sorting.key];
      
      if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sorting]);

  // Memoize paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const handleSort = useCallback((key: keyof T) => {
    if (sorting?.onSort) {
      sorting.onSort(key);
    }
  }, [sorting]);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sorting?.key === column.key && (
                      <span className="text-blue-500">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render 
                      ? column.render(item[column.key], item, index)
                      : String(item[column.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized Card Component
interface OptimizedCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const OptimizedCard = memo<OptimizedCardProps>(({
  title,
  description,
  children,
  actions,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex space-x-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
});
OptimizedCard.displayName = 'OptimizedCard';

// Performance monitoring hook
export function usePerformanceMonitor(operationName: string) {
  const startTimeRef = useRef<number | undefined>(undefined);
  
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.debug(`${operationName} took ${duration.toFixed(2)}ms`);
    }
  }, [operationName]);
  
  return { start, end };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
}
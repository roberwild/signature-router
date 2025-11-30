'use client';

import { 
  memo, 
  useRef, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  ReactNode,
  CSSProperties
} from 'react';
import { cn } from '@/lib/utils';

export interface VirtualScrollProps<T = unknown> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export const VirtualScroll = memo<VirtualScrollProps>(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  getItemKey = (_, index) => index
}) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const getHeight = useCallback((item: unknown, index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
  }, [itemHeight]);

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions = new Array(items.length);
    let currentPosition = 0;
    
    for (let i = 0; i < items.length; i++) {
      positions[i] = {
        top: currentPosition,
        height: getHeight(items[i], i)
      };
      currentPosition += positions[i].height;
    }
    
    return positions;
  }, [items, getHeight]);

  const totalHeight = itemPositions.length > 0 
    ? itemPositions[itemPositions.length - 1].top + itemPositions[itemPositions.length - 1].height 
    : 0;

  // Find visible range
  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = itemPositions.length - 1;

    // Binary search for start
    let left = 0;
    let right = itemPositions.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const position = itemPositions[mid];
      
      if (position.top + position.height < scrollTop) {
        left = mid + 1;
      } else {
        end = mid;
        right = mid - 1;
      }
    }
    start = Math.max(0, left - overscan);

    // Binary search for end
    left = 0;
    right = itemPositions.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const position = itemPositions[mid];
      
      if (position.top <= scrollTop + containerHeight) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    end = Math.min(itemPositions.length - 1, right + overscan);

    return { start, end };
  }, [itemPositions, scrollTop, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= items.length) break;
      
      const item = items[i];
      const position = itemPositions[i];
      
      items_to_render.push({
        item,
        index: i,
        key: getItemKey(item, i),
        style: {
          position: 'absolute' as const,
          top: position.top,
          width: '100%',
          height: position.height
        }
      });
    }
    
    return items_to_render;
  }, [items, itemPositions, visibleRange, getItemKey]);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key, style }) => (
          <div key={key} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualScroll.displayName = 'VirtualScroll';

// Virtual Table component
export interface VirtualTableColumn<T> {
  key: string;
  title: string;
  width?: number | string;
  render: (item: T, index: number) => ReactNode;
  sortable?: boolean;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  containerHeight: number;
  className?: string;
  getRowKey?: (item: T, index: number) => string | number;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export const VirtualTable = memo<VirtualTableProps<unknown>>(({
  data,
  columns,
  rowHeight = 48,
  containerHeight,
  className,
  getRowKey = (_, index) => index,
  onSort,
  sortColumn,
  sortDirection
}) => {
  const headerHeight = 40;
  const bodyHeight = containerHeight - headerHeight;

  const renderRow = useCallback((item: unknown, index: number, style: CSSProperties) => (
    <div className="flex border-b border-gray-200 hover:bg-gray-50" style={style}>
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex items-center px-4 py-2 text-sm"
          style={{ 
            width: column.width || `${100 / columns.length}%`,
            minWidth: 0
          }}
        >
          {column.render(item, index)}
        </div>
      ))}
    </div>
  ), [columns]);

  const handleSort = useCallback((column: VirtualTableColumn<unknown>) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  }, [sortColumn, sortDirection, onSort]);

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div 
        className="flex bg-gray-50 border-b border-gray-200"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex items-center px-4 py-2 text-sm font-medium text-gray-900',
              column.sortable && 'cursor-pointer hover:bg-gray-100'
            )}
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: 0
            }}
            onClick={() => handleSort(column)}
          >
            <span className="truncate">{column.title}</span>
            {column.sortable && sortColumn === column.key && (
              <span className="ml-1">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <VirtualScroll
        items={data}
        itemHeight={rowHeight}
        containerHeight={bodyHeight}
        renderItem={renderRow}
        getItemKey={getRowKey}
        className="bg-white"
      />
    </div>
  );
});

VirtualTable.displayName = 'VirtualTable';

// Hook for virtual scrolling with dynamic content
export interface UseVirtualScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visibleRange: { start: number; end: number };
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
}): UseVirtualScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  const itemPositions = useMemo(() => {
    const positions = [];
    let currentTop = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);
      positions.push({ top: currentTop, height });
      currentTop += height;
    }
    
    return positions;
  }, [itemCount, getItemHeight]);

  const totalHeight = itemPositions.length > 0 
    ? itemPositions[itemPositions.length - 1].top + itemPositions[itemPositions.length - 1].height 
    : 0;

  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = itemPositions.length - 1;

    // Find start index
    for (let i = 0; i < itemPositions.length; i++) {
      const position = itemPositions[i];
      if (position.top + position.height >= scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    for (let i = start; i < itemPositions.length; i++) {
      const position = itemPositions[i];
      if (position.top > scrollTop + containerHeight) {
        end = Math.min(itemPositions.length - 1, i + overscan);
        break;
      }
    }

    return { start, end };
  }, [itemPositions, scrollTop, containerHeight, overscan]);

  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current || index < 0 || index >= itemPositions.length) {
      return;
    }

    const position = itemPositions[index];
    containerRef.current.scrollTop = position.top;
  }, [itemPositions]);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    containerRef,
    visibleRange,
    totalHeight,
    scrollToIndex,
    scrollToTop
  };
}
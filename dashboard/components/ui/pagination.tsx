'use client';

import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  showItemsPerPage?: boolean;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  siblingCount?: number;
}

export const Pagination = memo<PaginationProps>(({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
  showItemsPerPage = false,
  onItemsPerPageChange,
  className,
  siblingCount = 1
}) => {
  const pageNumbers = useMemo(() => {
    const delta = siblingCount;
    const range = [];
    
    // Always show first page
    range.push(1);
    
    if (currentPage - delta > 2) {
      range.push(-1); // Ellipsis
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage + delta < totalPages - 1) {
      range.push(-1); // Ellipsis
    }
    
    // Always show last page if there are more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range.filter((item, index, array) => array.indexOf(item) === index);
  }, [currentPage, totalPages, siblingCount]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      <div className="flex-1 flex justify-between sm:hidden">
        {/* Mobile pagination */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          {totalItems !== undefined && (
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          )}

          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Page numbers */}
          {pageNumbers.map((pageNumber, index) => (
            pageNumber === -1 ? (
              <span
                key={`ellipsis-${index}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
              >
                <MoreHorizontal className="h-5 w-5" />
              </span>
            ) : (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  pageNumber === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                )}
              >
                {pageNumber}
              </button>
            )
          ))}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

// Hook for pagination logic
export interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination({
  totalItems,
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1,
  onPageChange
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const setPage = useCallback((page: number) => {
    const normalizedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(normalizedPage);
    onPageChange?.(normalizedPage);
  }, [totalPages, onPageChange]);
  
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Adjust current page to maintain roughly the same position
    const newPage = Math.ceil((startIndex + 1) / newItemsPerPage);
    setPage(newPage);
  }, [startIndex, setPage]);
  
  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);
  
  const prevPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);
  
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;
  
  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    setPage,
    setItemsPerPage: handleItemsPerPageChange,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev
  };
}

// Add useState and useCallback imports
import { useState, useCallback } from 'react';
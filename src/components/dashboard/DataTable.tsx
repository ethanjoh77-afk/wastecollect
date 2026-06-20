import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../common';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyState,
  className,
  pagination,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 overflow-hidden', className)}>
        <div className="animate-pulse">
          <div className="flex gap-4 px-6 py-4 bg-secondary-50 dark:bg-slate-700/50">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex-1 h-4 bg-secondary-200 dark:bg-slate-600 rounded" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-t border-secondary-100 dark:border-slate-700">
              {columns.map((col) => (
                <div key={String(col.key)} className="flex-1 h-4 bg-secondary-100 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700', className)}>
        {emptyState || (
          <div className="text-center py-12 text-secondary-500 dark:text-secondary-400">
            No data available
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50 dark:bg-slate-700/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-6 py-4 text-left text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-slate-700">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'hover:bg-secondary-50 dark:hover:bg-slate-700/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-6 py-4 whitespace-nowrap text-sm', col.className)}
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-100 dark:border-slate-700">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

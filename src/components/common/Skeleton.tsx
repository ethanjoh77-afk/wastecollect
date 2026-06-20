import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-secondary-200 dark:bg-slate-700',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100 dark:border-slate-700">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="divide-y divide-secondary-100 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-secondary-100 dark:border-slate-700 p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

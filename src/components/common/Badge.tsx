import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
        success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
        info: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant, size, className, dot }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'success' && 'bg-success-500',
            variant === 'warning' && 'bg-warning-500',
            variant === 'error' && 'bg-error-500',
            variant === 'info' && 'bg-secondary-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'default' && 'bg-secondary-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
    resolved: 'success',
    rejected: 'error',
    open: 'warning',
    closed: 'success',
    available: 'success',
    on_route: 'info',
    maintenance: 'warning',
    inactive: 'error',
    paid: 'success',
    unpaid: 'warning',
    overdue: 'error',
    active: 'success',
  };

  const labelMap: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    resolved: 'Resolved',
    rejected: 'Rejected',
    open: 'Open',
    closed: 'Closed',
    available: 'Available',
    on_route: 'On Route',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    active: 'Active',
  };

  return (
    <Badge variant={variantMap[status] || 'default'} dot>
      {labelMap[status] || status}
    </Badge>
  );
}

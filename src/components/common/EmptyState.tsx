import { ReactNode } from 'react';
import { LucideIcon, Inbox, Search, FileQuestion } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'search' | 'not-found';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const defaultIcons = {
    default: Inbox,
    search: Search,
    'not-found': FileQuestion,
  };

  const DisplayIcon = Icon || defaultIcons[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="w-20 h-20 rounded-full bg-secondary-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <DisplayIcon className="w-10 h-10 text-secondary-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-secondary-600 dark:text-secondary-400 text-center max-w-md mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

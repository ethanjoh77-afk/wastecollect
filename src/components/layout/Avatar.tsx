import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name || 'User');
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-accent-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-error-500',
  ];
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-white dark:ring-slate-800',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white ring-2 ring-white dark:ring-slate-800',
        colors[colorIndex],
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

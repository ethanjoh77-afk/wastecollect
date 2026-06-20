import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'bg-primary-500',
  trend,
  className,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600 dark:text-success-400';
    if (trend === 'down') return 'text-error-600 dark:text-error-400';
    return 'text-secondary-600 dark:text-secondary-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border border-secondary-100 dark:border-slate-700',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-secondary-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">{Math.abs(change)}%</span>
              <span className="text-secondary-500 dark:text-secondary-400">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconColor)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  color?: string;
}

export function QuickAction({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'bg-primary-500',
}: QuickActionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-slate-700 shadow-card hover:shadow-card-hover transition-all text-left"
    >
      <div className={cn('p-2.5 rounded-lg', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-medium text-secondary-900 dark:text-white">{title}</p>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{description}</p>
      </div>
    </motion.button>
  );
}

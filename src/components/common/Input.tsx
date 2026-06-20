import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error
                ? 'border-error-500 focus:ring-error-500'
                : 'border-secondary-200 dark:border-slate-700',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400">
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-sm text-secondary-500 dark:text-secondary-400">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-error-500 dark:text-error-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-secondary-200 dark:border-slate-700',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

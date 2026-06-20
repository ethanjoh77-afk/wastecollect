import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, hint, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-secondary-900 dark:text-secondary-100 appearance-none cursor-pointer transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error
                ? 'border-error-500 focus:ring-error-500'
                : 'border-secondary-200 dark:border-slate-700',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
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

Select.displayName = 'Select';

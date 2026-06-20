import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'relative w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl',
                sizeClasses[size]
              )}
            >
              {(title || showClose) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-slate-700">
                  {title && (
                    <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  const variantClasses = {
    danger: 'bg-error-500 hover:bg-error-600',
    warning: 'bg-warning-500 hover:bg-warning-600',
    info: 'bg-primary-500 hover:bg-primary-600',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div
          className={cn(
            'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
            variant === 'danger' && 'bg-error-100 text-error-600',
            variant === 'warning' && 'bg-warning-100 text-warning-600',
            variant === 'info' && 'bg-primary-100 text-primary-600'
          )}
        >
          {variant === 'danger' && <X className="w-8 h-8" />}
          {variant === 'warning' && <X className="w-8 h-8" />}
          {variant === 'info' && <X className="w-8 h-8" />}
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50',
              variantClasses[variant]
            )}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

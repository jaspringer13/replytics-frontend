'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToasts, useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-900/90 border-green-700',
  error: 'bg-red-900/90 border-red-700',
  warning: 'bg-yellow-900/90 border-yellow-700',
  info: 'bg-blue-900/90 border-blue-700',
};

export function ToastContainer() {
  const toasts = useToasts();
  const { dismiss } = useToast();

  // Auto-dismiss toasts based on duration
  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.duration && toast.duration > 0) {
        return setTimeout(() => dismiss(toast.id), toast.duration);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [toasts, dismiss]);

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-start gap-3 min-w-[300px] max-w-[400px] p-4 rounded-lg border backdrop-blur-sm shadow-lg',
                toastStyles[toast.type]
              )}
              role="alert"
              aria-live="assertive"
            >
              <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-white">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-gray-300 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={`Dismiss ${toast.type} notification`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
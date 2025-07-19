'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { cn } from '@/lib/utils';

const statusConfig = {
  connected: {
    icon: Wifi,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700',
    label: 'Connected',
  },
  connecting: {
    icon: RefreshCw,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-700',
    label: 'Connecting...',
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700',
    label: 'Disconnected',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700',
    label: 'Error',
  },
};

interface ConnectionStatusIndicatorProps {
  position?: {
    bottom?: string;
    left?: string;
    right?: string;
    top?: string;
  };
}

export function ConnectionStatusIndicator({ 
  position = { bottom: '4', left: '4' } 
}: ConnectionStatusIndicatorProps) {
  const { status, lastSyncTime, isTokenRefreshing, message, isLoading, retry } = useConnectionStatus();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div 
      className="fixed z-40"
      style={{
        bottom: position.bottom ? `${position.bottom}rem` : undefined,
        left: position.left ? `${position.left}rem` : undefined,
        right: position.right ? `${position.right}rem` : undefined,
        top: position.top ? `${position.top}rem` : undefined,
      }}
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {(status !== 'connected' || isTokenRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm',
              config.bgColor,
              config.borderColor
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                config.color,
                (status === 'connecting' || isTokenRefreshing) && 'animate-spin'
              )}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className={cn('text-sm font-medium', config.color)}>
                {isTokenRefreshing ? 'Refreshing authentication...' : config.label}
              </span>
              {message && (
                <span className="text-xs text-gray-400">{message}</span>
              )}
            </div>
            {status === 'disconnected' || status === 'error' ? (
              <button
                onClick={retry}
                className="ml-2 text-xs text-gray-400 hover:text-white transition-colors"
                aria-label="Retry connection"
                type="button"
              >
                Retry
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && status === 'connected' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg"
          >
            <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
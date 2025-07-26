import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsLoadingWrapperProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function SettingsLoadingWrapper({
  loading,
  error,
  onRetry,
  children,
}: SettingsLoadingWrapperProps) {
  if (loading) {
    return <SettingsLoadingSkeleton />;
  }

  if (error) {
    return (
      <SettingsErrorDisplay
        error={error}
        onRetry={onRetry}
      />
    );
  }

  return <>{children}</>;
}

function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="settings-loading-skeleton">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        
        {/* Tabs skeleton */}
        <div className="h-12 bg-gray-700 rounded mb-6"></div>
        
        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-96 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

interface SettingsErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

function SettingsErrorDisplay({ error, onRetry }: SettingsErrorDisplayProps) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';
import { CallErrorBoundary } from './CallErrorBoundary';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { SettingsErrorBoundary } from './SettingsErrorBoundary';
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';

interface Props {
  children: ReactNode;
}

export function ErrorBoundaryProvider({ children }: Props) {
  const pathname = usePathname();

  const getFeatureBoundary = (content: ReactNode): ReactNode => {
    if (pathname?.includes('/dashboard/calls')) {
      return <CallErrorBoundary>{content}</CallErrorBoundary>;
    }
    
    if (pathname?.includes('/dashboard/settings')) {
      return <SettingsErrorBoundary>{content}</SettingsErrorBoundary>;
    }
    
    if (pathname?.includes('/dashboard/analytics')) {
      return <AnalyticsErrorBoundary>{content}</AnalyticsErrorBoundary>;
    }
    
    if (pathname?.includes('/dashboard')) {
      return <DashboardErrorBoundary>{content}</DashboardErrorBoundary>;
    }
    
    return content;
  };

  return (
    <ErrorBoundaryContext.Provider value={{ pathname }}>
      {getFeatureBoundary(children)}
    </ErrorBoundaryContext.Provider>
  );
}

const ErrorBoundaryContext = React.createContext<{
  pathname: string | null;
}>({
  pathname: null,
});

export function useErrorBoundaryContext() {
  return React.useContext(ErrorBoundaryContext);
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  feature: 'dashboard' | 'calls' | 'settings' | 'analytics' | 'billing'
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <FeatureErrorBoundary feature={feature}>
        <Component {...props} />
      </FeatureErrorBoundary>
    );
  };
}
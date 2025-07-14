'use client';

import React from 'react';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';

interface Props {
  children: React.ReactNode;
}

export function AnalyticsErrorBoundary({ children }: Props) {
  return (
    <FeatureErrorBoundary
      feature="analytics"
      onError={(error) => {
        console.warn('[Analytics Error]', {
          error,
          timestamp: new Date().toISOString(),
          message: 'Analytics error caught - data collection continues in background',
        });
      }}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
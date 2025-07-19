'use client';

import React from 'react';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';

interface Props {
  children: React.ReactNode;
}

export function SettingsErrorBoundary({ children }: Props) {
  return (
    <FeatureErrorBoundary
      feature="settings"
      onError={(error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Settings Error]', {
            error,
            timestamp: new Date().toISOString(),
          });
        }
      }}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
'use client';

import React from 'react';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';
import { Settings } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function SettingsErrorBoundary({ children }: Props) {
  return (
    <FeatureErrorBoundary
      feature="settings"
      onError={(error) => {
        console.warn('[Settings Error]', {
          error,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
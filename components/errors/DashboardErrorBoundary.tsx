'use client';

import React from 'react';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';
import { Button } from '@/components/ui/Button';
import { BarChart3, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function DashboardErrorBoundary({ children }: Props) {
  return (
    <FeatureErrorBoundary
      feature="dashboard"
      fallback={
        <div className="min-h-[600px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Dashboard Temporarily Unavailable</h2>
            <p className="text-gray-600 mb-6">
              We're having trouble loading your dashboard data. This won't affect your active services.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Dashboard
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => window.location.href = '/dashboard/calls'}
                  variant="outline"
                  size="sm"
                >
                  View Calls
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard/sms'}
                  variant="outline"
                  size="sm"
                >
                  View SMS
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </FeatureErrorBoundary>
  );
}
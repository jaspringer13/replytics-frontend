'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DashboardErrorBoundary, CallErrorBoundary, AnalyticsErrorBoundary } from '@/components/errors';

function ComponentThatErrors({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('Test component error');
  }
  
  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <p className="text-green-800">Component is working normally</p>
    </div>
  );
}

export default function TestErrorBoundaries() {
  const [dashboardError, setDashboardError] = useState(false);
  const [callError, setCallError] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Error Boundary Hierarchy Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Dashboard Section</h2>
          <DashboardErrorBoundary>
            <ComponentThatErrors shouldError={dashboardError} />
          </DashboardErrorBoundary>
          <Button
            onClick={() => setDashboardError(!dashboardError)}
            variant="outline"
            className="w-full"
          >
            Toggle Dashboard Error
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Call Section</h2>
          <CallErrorBoundary>
            <ComponentThatErrors shouldError={callError} />
          </CallErrorBoundary>
          <Button
            onClick={() => setCallError(!callError)}
            variant="outline"
            className="w-full"
          >
            Toggle Call Error
          </Button>
          <div 
            data-active-call="true" 
            className="p-2 bg-blue-50 text-blue-800 text-sm rounded"
          >
            Simulated active call indicator
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Analytics Section</h2>
          <AnalyticsErrorBoundary>
            <ComponentThatErrors shouldError={analyticsError} />
          </AnalyticsErrorBoundary>
          <Button
            onClick={() => setAnalyticsError(!analyticsError)}
            variant="outline"
            className="w-full"
          >
            Toggle Analytics Error
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Error States:</h3>
        <ul className="space-y-1 text-sm">
          <li>Dashboard: {dashboardError ? '❌ Error' : '✅ Normal'}</li>
          <li>Call: {callError ? '❌ Error' : '✅ Normal'}</li>
          <li>Analytics: {analyticsError ? '❌ Error' : '✅ Normal'}</li>
        </ul>
      </div>
    </div>
  );
}
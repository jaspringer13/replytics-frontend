'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AppError } from '@/lib/errors/types';
import { fromError } from '@/lib/errors/factory';

declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'set', eventName: string, parameters: Record<string, unknown>) => void;
  }
}

interface Props {
  children: ReactNode;
  feature: 'dashboard' | 'calls' | 'settings' | 'analytics' | 'billing';
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: React.ErrorInfo | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  private static normalizeError(error: Error): AppError {
    return error instanceof AppError ? error : fromError(error);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = FeatureErrorBoundary.normalizeError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = FeatureErrorBoundary.normalizeError(error);
    
    console.error(`[${this.props.feature} Error Boundary]`, {
      error: appError,
      errorInfo,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `${this.props.feature}: ${appError.message}`,
        fatal: false,
        error_type: appError.code,
        feature: this.props.feature,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-center mb-2">
              {this.getFeatureErrorTitle()}
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {this.getFeatureErrorMessage()}
            </p>

            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={() => {
                  // Use window.location.href instead of Next.js router to force a full page reload
                  // This ensures complete reset of application state when recovering from errors
                  window.location.href = '/dashboard';
                }}
                className="w-full"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getFeatureErrorTitle(): string {
    const titles = {
      dashboard: 'Dashboard Error',
      calls: 'Calls Feature Error',
      settings: 'Settings Error',
      analytics: 'Analytics Error',
      billing: 'Billing Error',
    };
    return titles[this.props.feature] || 'Feature Error';
  }

  private getFeatureErrorMessage(): string {
    const messages = {
      dashboard: 'There was an issue loading the dashboard. Please try refreshing the page.',
      calls: 'We encountered an error with the calls feature. Your active calls are still connected.',
      settings: 'Unable to load settings. Please try again.',
      analytics: 'Analytics data is temporarily unavailable.',
      billing: 'Billing information could not be loaded. Please try again later.',
    };
    return messages[this.props.feature] || 'This feature encountered an error. Please try again.';
  }
}
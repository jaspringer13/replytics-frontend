'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Phone, AlertCircle, WifiOff } from 'lucide-react';
import { AppError, VoiceCallError } from '@/lib/errors/types';
import { ErrorFactory } from '@/lib/errors/factory';

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, parameters: any) => void;
  }
}

interface Props {
  children: ReactNode;
  onCallError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
}

export class CallErrorBoundary extends Component<Props, State> {
  private recoveryTimer: NodeJS.Timeout | null = null;
  private readonly MAX_RECOVERY_ATTEMPTS = 5;
  private readonly RECOVERY_DELAY = 2000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = error instanceof AppError ? error : ErrorFactory.fromError(error);
    
    console.error('[CRITICAL - Call Error Boundary] Error caught, preserving call state', {
      error: appError,
      timestamp: new Date().toISOString(),
    });

    return {
      hasError: true,
      error: appError,
      isRecovering: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = error instanceof AppError ? error : ErrorFactory.fromError(error);
    
    console.error('[Call Error Boundary - Details]', {
      error: appError,
      errorInfo,
      callId: this.getActiveCallId(),
    });

    if (this.props.onCallError) {
      this.props.onCallError(appError);
    }

    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `Call UI Error: ${appError.message}`,
        fatal: true,
        error_type: 'voice_call_ui_error',
        call_id: this.getActiveCallId(),
      });
    }

    this.attemptRecovery();
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  private getActiveCallId(): string | null {
    try {
      const callData = sessionStorage.getItem('activeCallData');
      if (callData) {
        const parsed = JSON.parse(callData);
        return parsed.callId || null;
      }
    } catch (e) {
      console.error('Failed to get active call ID', e);
    }
    return null;
  }

  private attemptRecovery = () => {
    if (this.state.recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
      console.error('[Call Error Boundary] Max recovery attempts reached');
      this.setState({ isRecovering: false });
      return;
    }

    console.log(`[Call Error Boundary] Recovery attempt ${this.state.recoveryAttempts + 1}/${this.MAX_RECOVERY_ATTEMPTS}`);

    this.recoveryTimer = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        isRecovering: false,
        recoveryAttempts: prevState.recoveryAttempts + 1,
      }));
    }, this.RECOVERY_DELAY);
  };

  private handleManualRecovery = () => {
    this.setState({
      recoveryAttempts: 0,
    }, () => {
      this.attemptRecovery();
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const isVoiceCallError = this.state.error instanceof VoiceCallError;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center">
                    <Phone className="w-10 h-10 text-red-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2">
                Call Interface Error
              </h1>
              
              <p className="text-gray-300 text-center mb-6">
                {this.state.isRecovering 
                  ? 'Attempting to recover call interface...'
                  : 'The call interface encountered an error, but your call is still active.'
                }
              </p>

              {this.state.isRecovering && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Recovery Progress</span>
                    <span>{this.state.recoveryAttempts + 1}/{this.MAX_RECOVERY_ATTEMPTS}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((this.state.recoveryAttempts + 1) / this.MAX_RECOVERY_ATTEMPTS) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-semibold mb-1">
                      Your call is still connected
                    </p>
                    <p className="text-green-300 text-sm">
                      Audio is being maintained in the background. Do not close this window.
                    </p>
                  </div>
                </div>
              </div>

              {!this.state.isRecovering && (
                <div className="space-y-3">
                  <Button
                    onClick={this.handleManualRecovery}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Retry Recovery
                  </Button>
                  
                  <Button
                    onClick={() => window.open('/dashboard/calls', '_blank')}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Open Calls in New Tab
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-400">
                <p>Error ID: {this.state.error.code}</p>
                {isVoiceCallError && (
                  <p className="mt-1">Call ID: {this.getActiveCallId() || 'Unknown'}</p>
                )}
              </div>
            </div>

            <div className="mt-4 text-center">
              <a
                href="tel:+1-800-SUPPORT"
                className="text-sm text-blue-400 hover:underline"
              >
                Emergency Support: +1-800-SUPPORT
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
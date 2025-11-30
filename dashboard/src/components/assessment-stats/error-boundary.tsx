'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class AssessmentStatsErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Assessment Stats Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div>
            <AlertTitle className="ml-6 mt-1 text-red-800">
              Error Loading Statistics
            </AlertTitle>
            <AlertDescription className="mt-1 text-red-700">
              Unable to load assessment statistics. Your assessment results are still available.
              <div className="mt-2">
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}
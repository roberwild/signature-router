'use client';

import * as React from 'react';
import ServiceUnavailable from './service-unavailable/page';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error for debugging
  React.useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  // Check for database/adapter errors
  if (
    error.message?.includes('AdapterError') ||
    error.message?.includes('SessionTokenError') ||
    error.message?.includes('AggregateError') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('Database connection failed') ||
    error.message?.includes('connection')
  ) {
    return <ServiceUnavailable />;
  }

  // For other errors, show a generic error message
  return (
    <div className="flex flex-col py-32 items-center justify-center text-center">
      <h2 className="font-heading my-2 text-2xl font-bold">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
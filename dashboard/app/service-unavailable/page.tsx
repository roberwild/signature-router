'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export default function ServiceUnavailablePage(): React.JSX.Element {
  const handleRefresh = (): void => {
    window.location.reload();
  };

  return (
    <main className="h-screen dark:bg-background bg-gray-50 flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center text-center max-w-md">
        <div className="mb-8 text-muted-foreground">
          <AlertCircle className="h-24 w-24 mx-auto" />
        </div>
        <span className="text-[10rem] font-semibold leading-none">503</span>
        <h1 className="font-heading my-4 text-3xl font-bold">
          Service Temporarily Unavailable
        </h1>
        <p className="text-muted-foreground mb-8">
          We&apos;re experiencing technical difficulties and cannot connect to our services. 
          Our team has been notified and is working on the issue. Please try again in a few moments.
        </p>
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleRefresh}
          className="min-w-[120px]"
        >
          Try Again
        </Button>
      </div>
    </main>
  );
}
'use client';

import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function QuestionnairesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Questionnaires error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <AlertTitle className="ml-6 mt-1">Error Loading Questionnaires</AlertTitle>
          <AlertDescription className="mt-1">
            {error.message || 'An unexpected error occurred while loading the questionnaire management panel.'}
          </AlertDescription>
        </div>
      </Alert>
      
      <div className="mt-4">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
}
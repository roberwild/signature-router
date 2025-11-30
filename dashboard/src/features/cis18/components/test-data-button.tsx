'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TestDataButtonProps {
  organizationId: string;
  userId: string;
}

export function TestDataButton({ organizationId, userId }: TestDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateTestData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cis18/test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, userId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating test data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateTestData}
      disabled={isLoading}
      variant="outline"
      className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creando datos de prueba...
        </>
      ) : (
        '🧪 Crear Datos de Prueba'
      )}
    </Button>
  );
}
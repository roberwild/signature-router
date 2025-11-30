'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { markLeadAsViewedAction } from '~/actions/admin/mark-lead-as-viewed';

interface MarkAsViewedButtonProps {
  leadId: string;
  userId: string;
  hasViewed: boolean;
  locale: string;
}

export function MarkAsViewedButton({ 
  leadId, 
  userId, 
  hasViewed: initialHasViewed,
  locale 
}: MarkAsViewedButtonProps) {
  const [hasViewed, setHasViewed] = useState(initialHasViewed);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsViewed = async () => {
    if (hasViewed) return; // Already viewed
    
    setIsLoading(true);
    try {
      const result = await markLeadAsViewedAction(leadId, userId);
      if (result.success) {
        setHasViewed(true);
      }
    } catch (error) {
      console.error('Failed to mark lead as viewed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasViewed) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Eye className="h-4 w-4" />
        {locale === 'es' ? 'Marcado como visto' : 'Marked as Viewed'}
      </Button>
    );
  }

  return (
    <Button 
      variant="default" 
      onClick={handleMarkAsViewed}
      disabled={isLoading}
      className="gap-2 bg-blue-500 hover:bg-blue-600"
    >
      <EyeOff className="h-4 w-4" />
      {isLoading 
        ? (locale === 'es' ? 'Marcando...' : 'Marking...') 
        : (locale === 'es' ? 'Marcar como visto' : 'Mark as Viewed')
      }
    </Button>
  );
}
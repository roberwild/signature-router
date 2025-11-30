'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { X, Target, Clock } from 'lucide-react';
import { UnifiedQuestionnaire } from '../shared/unified-questionnaire';
import type { Question } from '~/data/lead-qualification/default-questionnaire';
import type { LeadProfile } from '../shared/types';

interface FollowUpPromptProps {
  lead: LeadProfile;
  questions: Question[];
  onComplete: (responses: Record<string, unknown>) => Promise<void>;
  onDismiss: () => void;
  onSnooze?: (hours: number) => void;
  maxQuestionsPerSession?: number;
}

export function FollowUpPrompt({
  lead,
  questions,
  onComplete,
  onDismiss,
  onSnooze,
  maxQuestionsPerSession = 2
}: FollowUpPromptProps): React.JSX.Element | null {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleComplete = async (responses: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      await onComplete(responses);
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze(24); // Default 24 hours
    }
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <Card className="relative border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Completa tu perfil de seguridad</CardTitle>
            <CardDescription>
              Tu perfil está {lead.profileCompleteness}% completo. 
              Responde {Math.min(maxQuestionsPerSession, questions.length)} pregunta{maxQuestionsPerSession > 1 ? 's' : ''} más para recibir recomendaciones personalizadas.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <UnifiedQuestionnaire
          questions={questions.slice(0, maxQuestionsPerSession)}
          previousResponses={lead.followUpResponses}
          onComplete={handleComplete}
          isFollowUp={true}
          showProgress={false}
        />
        
        {onSnooze && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSnooze}
              disabled={isLoading}
            >
              <Clock className="mr-2 h-4 w-4" />
              Recordarme mañana
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
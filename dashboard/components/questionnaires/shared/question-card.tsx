'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import type { QuestionCardProps } from './types';

export function QuestionCard({
  questionNumber,
  question,
  children,
  showHelpTooltip = true
}: QuestionCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {questionNumber}
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">
              {question.question}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </CardTitle>
            {!question.required && (
              <CardDescription>
                Esta pregunta es opcional, pero nos ayuda a ofrecerte un mejor servicio
              </CardDescription>
            )}
          </div>
          {showHelpTooltip && question.scoring_weight && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Esta pregunta ayuda a evaluar tu nivel de urgencia y necesidades específicas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
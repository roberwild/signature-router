'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Eye, ArrowRight, Star } from 'lucide-react';
import type { QuestionConfig } from '~/data/admin/questionnaires/get-question-configs';

interface QuestionFlowPreviewProps {
  questions: QuestionConfig[];
  category?: string;
}

export function QuestionFlowPreview({ questions, category = 'A1' }: QuestionFlowPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter and sort questions for preview
  const previewQuestions = questions
    .filter(q => q.enabled && (!q.category || q.category === category))
    .sort((a, b) => {
      // Critical questions first
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      // Then by priority
      if (a.priority !== b.priority) return b.priority - a.priority;
      // Finally by order
      return a.orderIndex - b.orderIndex;
    });

  // Simulate session grouping (3 questions per session)
  const sessions: QuestionConfig[][] = [];
  const questionsPerSession = 3;
  
  for (let i = 0; i < previewQuestions.length; i += questionsPerSession) {
    sessions.push(previewQuestions.slice(i, i + questionsPerSession));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Preview Flow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Questionnaire Flow Preview</DialogTitle>
          <DialogDescription>
            Showing how questions will be presented to {category} leads
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {sessions.map((session, sessionIndex) => (
              <Card key={sessionIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Session {sessionIndex + 1}
                    </CardTitle>
                    <Badge variant="outline">
                      {session.length} question{session.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {sessionIndex === 0 && (
                    <CardDescription>
                      First contact - Focus on critical questions
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session.map((question, qIndex) => (
                      <div key={question.id} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {sessionIndex * questionsPerSession + qIndex + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {question.isCritical && (
                              <Badge variant="default" className="text-xs">
                                <Star className="mr-1 h-3 w-3" />
                                Critical
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Priority: {question.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{question.questionText}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {question.questionType.replace('_', ' ')}
                          </p>
                        </div>
                        {qIndex < session.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No enabled questions for category {category}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Questions are grouped into sessions of {questionsPerSession} questions each. 
            Critical questions are prioritized and asked first. The actual order may vary based on 
            lead responses and behavioral triggers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
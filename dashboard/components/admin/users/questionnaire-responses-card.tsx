'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { 
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Edit3,
  History,
  MessageSquareText
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface QuestionnaireResponsesCardProps {
  responses?: {
    initial?: Record<string, unknown>;
    followUp?: Record<string, unknown>;
  };
  sessions?: Array<{
    id: string;
    sessionType: string;
    responses: unknown;
    completedAt?: Date | null;
    questionsAnswered: number;
    totalQuestions?: number | null;
  }>;
  edits?: Array<{
    id: string;
    questionId: string;
    questionText?: string | null;
    oldValue: unknown;
    newValue: unknown;
    editedAt: Date;
    editSource?: string | null;
  }>;
}

export function QuestionnaireResponsesCard({ 
  responses, 
  sessions = [],
  edits = []
}: QuestionnaireResponsesCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['latest']));
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderResponse = (key: string, value: unknown, depth = 0) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">No response</span>;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className={cn("space-y-1", depth > 0 && "ml-4 pl-4 border-l")}>
              <Label className="text-xs text-muted-foreground capitalize">
                {k.replace(/_/g, ' ')}
              </Label>
              <div className="text-sm">{renderResponse(k, v, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-sm">Yes</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Circle className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">No</span>
        </div>
      );
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  const latestSession = sessions.find(s => s.completedAt);
  const allResponses = {
    ...responses?.initial,
    ...responses?.followUp,
    ...(latestSession?.responses || {})
  };

  const hasResponses = Object.keys(allResponses).length > 0;

  if (!hasResponses && sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Questionnaire Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No questionnaire responses available for this user yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Questionnaire Responses
          </CardTitle>
          {edits.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Edit3 className="h-3 w-3" />
              {edits.length} edits
            </Badge>
          )}
        </div>
        <CardDescription>
          Complete onboarding questionnaire responses and classification data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest Responses */}
        {Object.keys(allResponses).length > 0 && (
          <Collapsible
            open={expandedSections.has('latest')}
            onOpenChange={() => toggleSection('latest')}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Current Responses</span>
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(allResponses).length} answers
                  </Badge>
                </div>
                {expandedSections.has('latest') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3 pb-1">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(allResponses).map(([key, value]) => (
                  <div key={key} className="space-y-2 pb-3 border-b last:border-0">
                    <Label className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <div className="pl-4">
                      {renderResponse(key, value)}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Session History */}
        {sessions.length > 0 && (
          <Collapsible
            open={expandedSections.has('history')}
            onOpenChange={() => toggleSection('history')}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span className="font-medium">Response History</span>
                  <Badge variant="secondary" className="ml-2">
                    {sessions.length} sessions
                  </Badge>
                </div>
                {expandedSections.has('history') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3 pb-1">
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={session.completedAt ? "default" : "secondary"}>
                          {session.sessionType?.replace('_', ' ') || 'Session'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {session.questionsAnswered}/{session.totalQuestions || '?'} questions
                        </span>
                      </div>
                      {session.completedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(session.completedAt), "dd MMM yyyy HH:mm", { locale: es })}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const responses = session.responses as Record<string, unknown> | null | undefined;
                      return responses && typeof responses === 'object' && responses !== null && Object.keys(responses).length > 0;
                    })() && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-start p-1">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            View responses
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 pl-4 space-y-2">
                          {Object.entries(session.responses as Record<string, unknown>).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>{' '}
                              <span className="text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                          {Object.keys(session.responses as Record<string, unknown>).length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{Object.keys(session.responses as Record<string, unknown>).length - 5} more responses
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Edit History */}
        {edits.length > 0 && (
          <Collapsible
            open={expandedSections.has('edits')}
            onOpenChange={() => toggleSection('edits')}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Edit History</span>
                  <Badge variant="secondary" className="ml-2">
                    {edits.length} edits
                  </Badge>
                </div>
                {expandedSections.has('edits') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3 pb-1">
              <div className="space-y-2">
                {edits.slice(0, 5).map((edit) => (
                  <div key={edit.id} className="p-2 rounded border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {edit.questionText || edit.questionId}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(edit.editedAt), "dd MMM HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Old: </span>
                        <span>{JSON.stringify(edit.oldValue)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">New: </span>
                        <span>{JSON.stringify(edit.newValue)}</span>
                      </div>
                    </div>
                    {edit.editSource && (
                      <Badge variant="outline" className="text-xs">
                        via {edit.editSource}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
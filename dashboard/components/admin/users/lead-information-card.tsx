'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { Label } from '@workspace/ui/components/label';
import { 
  Mail,
  Target,
  Award,
  MessageSquare,
  Clock,
  Brain,
  Activity
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface LeadInformationCardProps {
  leadData?: {
    id: string;
    email: string;
    leadScore: number;
    leadCategory: 'A1' | 'B1' | 'C1' | 'D1';
    profileCompleteness: number;
    preferredChannel: 'platform' | 'email' | 'whatsapp';
    lastQuestionnaireAt?: Date | null;
    lastEditAt?: Date | null;
    lastContactAt?: Date | null;
    source?: string | null;
    initialResponses?: unknown;
    followUpResponses?: unknown;
  };
  questionnaireSessions?: Array<{
    id: string;
    sessionType: string;
    completedAt?: Date | null;
    questionsAnswered: number;
    totalQuestions?: number | null;
    completionTime?: number | null;
    channel: 'platform' | 'email' | 'whatsapp';
  }>;
}

const categoryColors = {
  A1: 'bg-green-500',
  B1: 'bg-blue-500',
  C1: 'bg-yellow-500',
  D1: 'bg-gray-400',
};

const categoryDescriptions = {
  A1: 'High Intent - Ready to buy',
  B1: 'Interested - Evaluating options',
  C1: 'Exploring - Early stage',
  D1: 'Low Intent - Just browsing',
};

export function LeadInformationCard({ 
  leadData, 
  questionnaireSessions = [] 
}: LeadInformationCardProps) {
  
  if (!leadData) {
    return null;
  }

  const completedSessions = questionnaireSessions.filter(s => s.completedAt);
  const avgCompletionTime = completedSessions.length > 0
    ? completedSessions.reduce((acc, s) => acc + (s.completionTime || 0), 0) / completedSessions.length
    : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Lead Intelligence
          </CardTitle>
          <Badge 
            className={cn(
              "text-white font-semibold px-3 py-1",
              categoryColors[leadData.leadCategory]
            )}
          >
            {leadData.leadCategory} - {categoryDescriptions[leadData.leadCategory]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lead Score & Profile Completeness */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Lead Score</Label>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{leadData.leadScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <Progress value={leadData.leadScore} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Profile Complete</Label>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{leadData.profileCompleteness}%</span>
              </div>
            </div>
            <Progress value={leadData.profileCompleteness} className="h-2" />
          </div>
        </div>

        {/* Lead Information Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <Label className="text-sm text-muted-foreground">Preferred Channel</Label>
            <div className="flex items-center gap-2 mt-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="capitalize">
                {leadData.preferredChannel}
              </Badge>
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Lead Source</Label>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {leadData.source || 'Direct'}
              </span>
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Last Questionnaire</Label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {leadData.lastQuestionnaireAt 
                  ? format(new Date(leadData.lastQuestionnaireAt), "dd MMM yyyy", { locale: es })
                  : 'Never'
                }
              </span>
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Last Contact</Label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {leadData.lastContactAt 
                  ? format(new Date(leadData.lastContactAt), "dd MMM yyyy", { locale: es })
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Questionnaire Sessions Summary */}
        {questionnaireSessions.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-semibold">Questionnaire Activity</Label>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {questionnaireSessions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completedSessions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {avgCompletionTime > 0 ? formatTime(Math.round(avgCompletionTime)) : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Avg Time</p>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Recent Sessions</Label>
              {questionnaireSessions.slice(0, 3).map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      session.completedAt ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {session.sessionType?.replace('_', ' ') || 'Initial'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.questionsAnswered}/{session.totalQuestions || '?'} questions • 
                        via {session.channel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.completedAt), "dd MMM", { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
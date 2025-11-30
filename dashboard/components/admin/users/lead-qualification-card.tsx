'use client';

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
import { Progress } from '@workspace/ui/components/progress';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { 
  Building2,
  Users,
  Shield,
  AlertTriangle,
  Target,
  Clock,
  FileCheck,
  Smartphone,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface LeadQualificationData {
  id: string;
  organizationId: string;
  organizationName: string | null;
  userId: string;
  mainConcern: string | null;
  complianceRequirements: string[] | null;
  complianceOther: string | null;
  itTeamSize: string | null;
  companySize: string | null;
  recentIncidents: string | null;
  optionalResponses: unknown;
  specificNeeds: string | null;
  leadScore: number | null;
  leadClassification: 'A1' | 'B1' | 'C1' | 'D1' | null;
  scoreComponents: {
    urgency: number;
    budget: number;
    fit: number;
    engagement: number;
    decision: number;
  } | null;
  completionTime: number | null;
  questionsAnswered: number | null;
  optionalAnswered: number | null;
  deviceType: string | null;
  abandonmentPoint: string | null;
  timePerQuestion: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadQualificationCardProps {
  leadQualifications: LeadQualificationData[];
}

const classificationColors = {
  A1: 'bg-green-500',
  B1: 'bg-blue-500',
  C1: 'bg-yellow-500',
  D1: 'bg-gray-400',
};

const _classificationDescriptions = {
  A1: 'High Intent - Ready to buy',
  B1: 'Interested - Evaluating options',
  C1: 'Exploring - Early stage',
  D1: 'Low Intent - Just browsing',
};

function getMainConcernLabel(concern: string | null) {
  const labels: Record<string, string> = {
    security_level: 'Security Assessment Needed',
    vulnerabilities: 'Vulnerability Testing Required',
    no_team: 'No Security Team',
    incident_response: 'Incident Response Needed',
  };
  return labels[concern || ''] || concern || 'Not specified';
}

function getCompanySizeLabel(size: string | null): string {
  const labels: Record<string, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '200+': '200+ employees',
  };
  return labels[size || ''] || size || 'Not specified';
}

function getItTeamSizeLabel(size: string | null): string {
  const labels: Record<string, string> = {
    'dedicated': 'Dedicated IT team',
    'small': '1-2 person IT team',
    'external': 'External IT management',
    'none': 'No IT team',
  };
  return labels[size || ''] || size || 'Not specified';
}

function getIncidentLabel(incident: string | null): string {
  const labels: Record<string, string> = {
    'urgent': 'Yes, need urgent help',
    'resolved': 'Yes, but resolved',
    'preventive': 'No, want prevention',
    'unsure': 'Not sure',
  };
  return labels[incident || ''] || incident || 'Not specified';
}

function formatCompletionTime(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function LeadQualificationCard({ leadQualifications }: LeadQualificationCardProps) {
  if (leadQualifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lead Qualification Data</h3>
        <Badge variant="secondary">
          {leadQualifications.length} {leadQualifications.length === 1 ? 'qualification' : 'qualifications'}
        </Badge>
      </div>

      {leadQualifications.map((lead) => (
        <Card key={lead.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">
                    {lead.organizationName || 'Direct Lead'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Submitted {format(new Date(lead.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-white font-semibold",
                    lead.leadClassification ? classificationColors[lead.leadClassification] : 'bg-gray-400'
                  )}
                >
                  {lead.leadClassification || 'N/A'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">{lead.leadScore ?? 0}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Components */}
            {lead.scoreComponents && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Score Breakdown</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(lead.scoreComponents).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                      <div className="mt-1">
                        <Progress value={(value as number / 20) * 100} className="h-1" />
                        <span className="text-xs font-medium">{value}/20</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Key Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Main Concern</Label>
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {getMainConcernLabel(lead.mainConcern)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Recent Incidents</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {getIncidentLabel(lead.recentIncidents)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Company Size</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {getCompanySizeLabel(lead.companySize)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">IT Team</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {getItTeamSizeLabel(lead.itTeamSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Requirements */}
            {lead.complianceRequirements && lead.complianceRequirements.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Compliance Requirements</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lead.complianceRequirements.map((req, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {req}
                      </Badge>
                    ))}
                    {lead.complianceOther && (
                      <Badge variant="outline" className="text-xs">
                        {lead.complianceOther}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Specific Needs */}
            {lead.specificNeeds && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Specific Needs</Label>
                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded">
                    {lead.specificNeeds}
                  </p>
                </div>
              </>
            )}

            {/* Metrics */}
            <Separator />
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="text-center p-2 bg-muted/30 rounded">
                <HelpCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">{lead.questionsAnswered || 0}</div>
                <div className="text-muted-foreground">Questions</div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded">
                <FileCheck className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">{lead.optionalAnswered || 0}</div>
                <div className="text-muted-foreground">Optional</div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold">
                  {formatCompletionTime(lead.completionTime)}
                </div>
                <div className="text-muted-foreground">Time</div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded">
                <Smartphone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-semibold capitalize">
                  {lead.deviceType || 'Unknown'}
                </div>
                <div className="text-muted-foreground">Device</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
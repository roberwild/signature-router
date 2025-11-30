import React from 'react';
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Building2, 
  Mail, 
  Phone,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  MessageSquare,
  Smartphone,
  Monitor,
  TrendingUp,
  Shield,
  Users as UsersIcon,
  DollarSign,
  Zap
} from 'lucide-react';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { AdminPageTitle } from '../../components/admin-page-title';
import {
  getLeadById,
  getLeadEvents,
  getClassificationColor,
  getResponseTimeRecommendation
} from '~/data/admin/get-lead-by-id';
import { isLeadViewed, getLeadViewHistory } from '~/data/admin/lead-views';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarkAsViewedButton } from './mark-as-viewed-button';

export const metadata: Metadata = {
  title: 'Lead Details | Minery Admin',
  description: 'View detailed lead information and scoring',
};

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

function formatCompletionTime(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getMainConcernDetails(concern: string | null) {
  const details: Record<string, { label: string; icon: React.ComponentType<{className?: string}>; service: string }> = {
    security_level: { 
      label: 'Security Assessment Needed', 
      icon: Shield,
      service: 'Maturity Analysis'
    },
    vulnerabilities: { 
      label: 'Vulnerability Testing Required', 
      icon: AlertCircle,
      service: 'Penetration Testing'
    },
    no_team: { 
      label: 'No Security Team', 
      icon: UsersIcon,
      service: 'Virtual CISO'
    },
    incident_response: { 
      label: 'Incident Response Needed', 
      icon: Zap,
      service: 'Forensic Analysis'
    },
  };
  return details[concern || ''] || { 
    label: concern || 'Not specified', 
    icon: AlertCircle,
    service: 'General Consultation'
  };
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

function ScoreComponent({
  name,
  value,
  max,
  icon: Icon
}: {
  name: string;
  value: number;
  max: number;
  icon: React.ComponentType<{className?: string}>;
}) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
        <span className="font-bold">{value}/{max}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  await requirePlatformAdmin();
  
  const resolvedParams = await params;

  const lead = await getLeadById(resolvedParams.id);
  
  if (!lead) {
    notFound();
  }

  const _events = await getLeadEvents(resolvedParams.id);
  const viewHistory = await getLeadViewHistory(resolvedParams.id);
  const hasViewed = await isLeadViewed(resolvedParams.id, session.user.id || '');
  const classificationColor = getClassificationColor(lead.leadClassification);
  const responseRecommendation = getResponseTimeRecommendation(lead.leadClassification);
  const mainConcernDetails = getMainConcernDetails(lead.mainConcern);

  // WhatsApp message template
  const whatsappMessage = encodeURIComponent(
    `Hola ${lead.userName}, soy del equipo de Minery Guard. ` +
    `Vi que estás interesado en ${mainConcernDetails.service}. ` +
    `¿Podemos hablar sobre cómo podemos ayudarte?`
  );
  const whatsappLink = lead.userPhone 
    ? `https://wa.me/${lead.userPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-4">
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Leads
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <AdminPageTitle 
                title="Lead Details" 
                info={`Score: ${lead.leadScore}/100`}
              />
            </div>
          </div>
        </PagePrimaryBar>
        <PageActions>
          <MarkAsViewedButton 
            leadId={resolvedParams.id}
            userId={session.user.id || ''}
            hasViewed={hasViewed}
            locale={resolvedParams.locale}
          />
          <Badge variant={classificationColor as "default" | "secondary" | "destructive" | "outline"} className="text-lg px-4 py-1">
            {lead.leadClassification} Lead
          </Badge>
          {whatsappLink && (
            <Link href={whatsappLink} target="_blank">
              <Button className="bg-green-500 hover:bg-green-600">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact via WhatsApp
              </Button>
            </Link>
          )}
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Response Time Alert */}
          <Card className={lead.leadClassification === 'A1' ? 'border-destructive' : ''}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Response Recommendation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{responseRecommendation}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Lead created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lead.userName}</p>
                    <p className="text-xs text-muted-foreground">Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lead.userEmail}</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                </div>
                {lead.userPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{lead.userPhone}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                )}
                {lead.organizationName && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{lead.organizationName}</p>
                      <p className="text-xs text-muted-foreground">Organization</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Score Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lead Score Breakdown</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{lead.leadScore}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <CardDescription>Component analysis of lead quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.scoreComponents && (
                  <>
                    <ScoreComponent 
                      name="Urgency" 
                      value={lead.scoreComponents.urgency} 
                      max={35}
                      icon={Zap}
                    />
                    <ScoreComponent 
                      name="Budget Potential" 
                      value={lead.scoreComponents.budget} 
                      max={25}
                      icon={DollarSign}
                    />
                    <ScoreComponent 
                      name="Product Fit" 
                      value={lead.scoreComponents.fit} 
                      max={20}
                      icon={Target}
                    />
                    <ScoreComponent 
                      name="Engagement" 
                      value={lead.scoreComponents.engagement} 
                      max={10}
                      icon={TrendingUp}
                    />
                    <ScoreComponent 
                      name="Decision Capacity" 
                      value={lead.scoreComponents.decision} 
                      max={10}
                      icon={CheckCircle}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Qualification Responses</CardTitle>
              <CardDescription>Required questions answered during onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Main Concern</p>
                    <div className="flex items-center gap-2">
                      {React.createElement(mainConcernDetails.icon, { className: "h-4 w-4 text-primary" })}
                      <p className="font-medium">{mainConcernDetails.label}</p>
                    </div>
                    <Badge variant="outline" className="mt-1">
                      Recommended: {mainConcernDetails.service}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Company Size</p>
                    <p className="font-medium">{getCompanySizeLabel(lead.companySize)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">IT Team</p>
                    <p className="font-medium">{getItTeamSizeLabel(lead.itTeamSize)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Recent Incidents</p>
                    <p className="font-medium">{getIncidentLabel(lead.recentIncidents)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Compliance Requirements</p>
                    {lead.complianceRequirements && lead.complianceRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.complianceRequirements.map((req) => (
                          <Badge key={req} variant="secondary">{req}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium">None specified</p>
                    )}
                    {lead.complianceOther && (
                      <p className="text-sm mt-1">Other: {lead.complianceOther}</p>
                    )}
                  </div>
                </div>
              </div>

              {lead.specificNeeds && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Specific Needs</p>
                  <p className="text-sm">{lead.specificNeeds}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Responses */}
          {lead.optionalResponses && Object.keys(lead.optionalResponses).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Optional questions answered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(lead.optionalResponses).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interaction Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Interaction Metrics</CardTitle>
              <CardDescription>How the lead engaged with the questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatCompletionTime(lead.completionTime)}</p>
                    <p className="text-xs text-muted-foreground">Completion time</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lead.questionsAnswered || 0} questions</p>
                    <p className="text-xs text-muted-foreground">Total answered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lead.deviceType === 'mobile' ? (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{lead.deviceType || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">Device type</p>
                  </div>
                </div>
              </div>

              {lead.abandonmentPoint && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Lead abandoned at: {lead.abandonmentPoint}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View History */}
          <Card>
            <CardHeader>
              <CardTitle>View History</CardTitle>
              <CardDescription>Admins who have viewed this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {viewHistory.length > 0 ? (
                <div className="space-y-3">
                  {viewHistory.map((view, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{view.viewedBy || 'Unknown Admin'}</p>
                        <p className="text-xs text-muted-foreground">
                          {view.viewedByEmail} • {format(new Date(view.viewedAt), 'PPp', { locale: resolvedParams.locale === 'es' ? es : undefined })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You are the first to view this lead</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Lead creation and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Lead created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lead.createdAt), 'PPpp', { locale: es })}
                    </p>
                  </div>
                </div>
                {lead.updatedAt && lead.updatedAt !== lead.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Last updated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lead.updatedAt), 'PPpp', { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}
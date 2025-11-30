'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Shield,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Save,
  MousePointerClick
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { AdminPageTitle } from '../../components/admin-page-title';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Switch } from '@workspace/ui/components/switch';
import { UserActions } from '../components/user-actions';
import { LeadInformationCard } from '~/components/admin/users/lead-information-card';
import { QuestionnaireResponsesCard } from '~/components/admin/users/questionnaire-responses-card';
import { LeadQualificationCard } from '~/components/admin/users/lead-qualification-card';
import { useTranslations } from '~/hooks/use-translations';

interface User {
  id: string;
  name: string;
  email: string | null;
  emailVerified: Date | null;
  isPlatformAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  organizationCount: number;
  serviceRequestCount: number;
}

interface Organization {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  role: string;
  joinedAt: Date;
}

interface ServiceRequest {
  id: string;
  serviceName: string;
  status: string;
  createdAt: Date;
}

// LeadQualificationData is what we receive from the database
interface LeadQualificationData {
  id: string;
  organizationId: string;
  organizationName?: string | null;
  userId?: string | null;
  mainConcern?: string | null;
  otherConcerns?: string[] | null;
  budget?: string | null;
  teamSize?: string | null;
  urgency?: string | null;
  leadScore?: number | null;
  leadCategory?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  communicationChannelPreference?: string | null;
  complianceNeeds?: string[] | null;
  complianceRequirements?: Record<string, unknown> | null;
  complianceOther?: string | null;
  itTeamSize?: string | null;
  companySize?: string | null;
  scoreComponents?: Record<string, unknown> | null;
  decisionMaker?: boolean | null;
  estimatedAnnualVolume?: string | null;
  followUp?: boolean | null;
  hasHighSecurityRequirements?: boolean | null;
  lastContactAt?: Date | null;
  profileCompleteness?: number | null;
  riskTolerance?: string | null;
  timeline?: string | null;
  leadClassification?: 'A1' | 'B1' | 'C1' | 'D1' | null;
  mainConcernDetails?: string | null;
  selectionPriority?: string | null;
  currentSolution?: string | null;
  switchTimeline?: string | null;
}

// LeadQualification is the simplified view used in the component
// Not used directly in this file but kept for reference
// interface LeadQualification {
//   id: string;
//   leadScore?: number;
//   leadCategory?: string;
//   createdAt: Date;
// }

interface LeadData {
  id: string;
  email: string;
  userId?: string | null;
  organizationId?: string | null;
  leadScore?: number | null;
  leadCategory?: 'A1' | 'B1' | 'C1' | 'D1' | null;
  profileCompleteness?: number | null;
  preferredChannel?: 'platform' | 'email' | 'whatsapp' | null;
  lastQuestionnaireAt?: Date | null;
  lastEditAt?: Date | null;
  lastContactAt?: Date | null;
  source?: string | null;
  initialResponses?: unknown;
  followUpResponses?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuestionnaireSession {
  id: string;
  leadId: string;
  versionId: string;
  sessionType?: string | null;
  completedAt?: Date | null;
  questionsAnswered?: number | null;
  totalQuestions?: number | null;
  currentQuestionIndex?: number | null;
  completionTime?: number | null;
  channel?: 'platform' | 'email' | 'whatsapp' | null;
  responses?: unknown;
  isComplete?: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  metadata?: unknown;
}

interface ResponseEdit {
  id: string;
  leadId: string;
  sessionId?: string | null;
  questionId: string;
  questionText?: string | null;
  oldValue: unknown;
  newValue: unknown;
  editedAt: Date;
  editSource?: string | null;
  editedBy?: string | null;
  scoreChange?: number | null;
  categoryChange?: string | null;
}

interface ServiceClick {
  serviceName: string;
  clickCount: number;
}

interface OrgServiceClick {
  organizationId: string;
  stats: {
    totalClicks: number;
    uniqueServices: number;
  };
  clicks: ServiceClick[];
}

export type UserDetailContentProps = {
  user: User;
  organizations: Organization[];
  recentActivity: ServiceRequest[];
  leadQualifications: LeadQualificationData[];
  leadData: LeadData | null;
  questionnaireSessions: QuestionnaireSession[];
  responseEdits: ResponseEdit[];
  orgServiceClicks: OrgServiceClick[];
  locale: string;
  updateUserAdmin: (isAdmin: boolean) => Promise<void>;
};

export function UserDetailContent({
  user,
  organizations,
  recentActivity,
  leadQualifications,
  leadData,
  questionnaireSessions,
  responseEdits,
  orgServiceClicks,
  locale,
  updateUserAdmin
}: UserDetailContentProps) {
  const { t } = useTranslations('admin/users');
  const dateLocale = locale === 'es' ? es : undefined;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title={user.name}
              info={`User ID: ${user.id.slice(0, 8)}...`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <UserActions
            user={{
              id: user.id,
              name: user.name || '',
              email: user.email || '',
              isPlatformAdmin: user.isPlatformAdmin,
            }}
            locale={locale}
          />
          <Link href={`/${locale}/admin/users`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('details.backToUsers')}
            </Button>
          </Link>
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.userInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.image || undefined} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-semibold">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t('details.emailStatus')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {user.emailVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{t('details.verified')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>{t('details.notVerified')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">{t('details.accountType')}</Label>
                      <div className="mt-1">
                        {user.isPlatformAdmin ? (
                          <Badge variant="default">
                            <Shield className="mr-1 h-3 w-3" />
                            {t('details.platformAdmin')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('details.regularUser')}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t('details.joined')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{format(new Date(user.createdAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">{t('details.lastUpdated')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{format(new Date(user.updatedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('details.organizations')}</CardTitle>
                    <Badge variant="secondary">{user.organizationCount} {t('details.total')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {organizations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('details.noOrganizations')}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('details.organization')}</TableHead>
                          <TableHead>{t('details.role')}</TableHead>
                          <TableHead>{t('details.serviceInterest')}</TableHead>
                          <TableHead>{t('details.joined')}</TableHead>
                          <TableHead>{t('table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizations.map((org) => {
                          const clickData = orgServiceClicks.find(c => c.organizationId === org.organizationId);
                          return (
                            <TableRow key={org.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{org.name}</p>
                                  <p className="text-sm text-muted-foreground">/{org.slug}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={String(org.role).toUpperCase() === 'OWNER' ? 'default' : 'secondary'}>
                                  {org.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {clickData && clickData.stats.totalClicks > 0 ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm font-medium">
                                        {clickData.stats.totalClicks} {t('details.clicks')}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        ({clickData.stats.uniqueServices} {t('details.services')})
                                      </span>
                                    </div>
                                    {clickData.clicks.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {clickData.clicks.map((service, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {service.serviceName}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t('details.noActivity')}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(org.joinedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                              </TableCell>
                              <TableCell>
                                <Link href={`/${locale}/admin/users?organization=${org.slug}`}>
                                  <Button size="sm" variant="ghost">
                                    {t('details.view')}
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Lead Qualification Card - Primary lead data from leadQualificationTable */}
              {leadQualifications.length > 0 && (
                <LeadQualificationCard
                  leadQualifications={leadQualifications}
                />
              )}

              {/* Lead Intelligence Card - Additional lead data from leads table */}
              {leadData && (
                <LeadInformationCard
                  leadData={{
                    id: leadData.id,
                    email: leadData.email,
                    leadScore: leadData.leadScore || 0,
                    leadCategory: (leadData.leadCategory || 'D1') as 'A1' | 'B1' | 'C1' | 'D1',
                    profileCompleteness: leadData.profileCompleteness || 0,
                    preferredChannel: (leadData.preferredChannel || 'platform') as 'platform' | 'email' | 'whatsapp',
                    lastQuestionnaireAt: leadData.lastQuestionnaireAt,
                    lastEditAt: leadData.lastEditAt,
                    lastContactAt: leadData.lastContactAt,
                    source: leadData.source,
                    initialResponses: leadData.initialResponses,
                    followUpResponses: leadData.followUpResponses
                  }}
                  questionnaireSessions={questionnaireSessions.map((session) => ({
                    id: session.id,
                    sessionType: session.sessionType || 'initial',
                    completedAt: session.completedAt,
                    questionsAnswered: session.questionsAnswered || 0,
                    totalQuestions: session.totalQuestions,
                    completionTime: session.completionTime,
                    channel: (session.channel || 'platform') as 'platform' | 'email' | 'whatsapp'
                  }))}
                />
              )}

              {/* Questionnaire Responses Card */}
              {leadData && (
                <QuestionnaireResponsesCard
                  responses={{
                    initial: leadData.initialResponses as Record<string, unknown> || {},
                    followUp: leadData.followUpResponses as Record<string, unknown> || {}
                  }}
                  sessions={questionnaireSessions.map((s) => ({
                    id: s.id,
                    sessionType: s.sessionType || 'initial',
                    responses: s.responses || {},
                    completedAt: s.completedAt,
                    questionsAnswered: s.questionsAnswered ?? 0,
                    totalQuestions: s.totalQuestions
                  }))}
                  edits={responseEdits}
                />
              )}

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.recentServiceRequests')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('details.noRecentActivity')}</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((request) => (
                        <div key={request.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{request.serviceName}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'in-progress' ? 'secondary' :
                            'outline'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Admin Controls */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.statistics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('details.organizations')}</span>
                    </div>
                    <span className="font-bold">{user.organizationCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('details.serviceRequests')}</span>
                    </div>
                    <span className="font-bold">{user.serviceRequestCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('details.serviceClicks')}</span>
                    </div>
                    <span className="font-bold">
                      {orgServiceClicks.reduce((sum, org) => sum + org.stats.totalClicks, 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.adminControls')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={async (formData) => {
                    const isAdmin = formData.get('isAdmin') === 'on';
                    await updateUserAdmin(isAdmin);
                  }}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isAdmin">{t('details.platformAdmin')}</Label>
                        <Switch
                          id="isAdmin"
                          name="isAdmin"
                          defaultChecked={user.isPlatformAdmin}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        {t('details.saveChanges')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${user.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {t('details.sendEmail')}
                    </a>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${locale}/admin/services?user=${user.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('details.viewServiceRequests')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
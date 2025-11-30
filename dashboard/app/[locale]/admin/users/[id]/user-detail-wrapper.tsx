import { redirect } from 'next/navigation';
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
// Translation provider and dictionaries will be handled by parent component
import { UserDetailContent } from './user-detail-content';
// import type { Locale } from '~/i18n/locales';

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

// LeadQualification is the simplified view
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

export type UserDetailWrapperProps = {
  locale: string;
  user: User;
  organizations: Organization[];
  recentActivity: ServiceRequest[];
  leadQualifications: LeadQualificationData[];
  leadData: LeadData | null;
  questionnaireSessions: QuestionnaireSession[];
  responseEdits: ResponseEdit[];
  orgServiceClicks: OrgServiceClick[];
  userId: string;
};

export async function UserDetailWrapper({
  locale,
  user,
  organizations,
  recentActivity,
  leadQualifications,
  leadData,
  questionnaireSessions,
  responseEdits,
  orgServiceClicks,
  userId
}: UserDetailWrapperProps) {
  // Mock dictionaries for now - will be handled by client component
  const _dictionaries: Record<string, unknown> = {};

  // Server action for updating admin status
  async function updateUserAdmin(isAdmin: boolean) {
    'use server';

    await db
      .update(userTable)
      .set({
        isPlatformAdmin: isAdmin,
        updatedAt: new Date()
      })
      .where(eq(userTable.id, userId));

    redirect(`/${locale}/admin/users/${userId}`);
  }

  return (
    <UserDetailContent
      user={user}
      organizations={organizations}
      recentActivity={recentActivity}
      leadQualifications={leadQualifications as LeadQualificationData[]}
      leadData={leadData}
      questionnaireSessions={questionnaireSessions}
      responseEdits={responseEdits}
      orgServiceClicks={orgServiceClicks}
      locale={locale}
      updateUserAdmin={updateUserAdmin}
    />
  );
}
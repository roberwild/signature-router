import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ClipboardCheck, AlertTriangle, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { isValidLocale, getPageDictionary, Locale } from '@/lib/i18n';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import Link from 'next/link';
import { buttonVariants } from '@workspace/ui/components/button';

import { AssessmentApi, type Assessment } from '~/src/features/assessments/data/assessment-api';
import { EvolutionChart } from '~/src/features/assessments/components/evolution-chart';
import { LoadingCard } from '~/components/organizations/slug/home/loading-card';
import { AssessmentsTanstackTable } from '~/src/features/assessments/components/assessments-tanstack-table';
import { AssessmentStatsWrapper } from '~/src/features/assessments/components/assessment-stats-wrapper';

export async function generateMetadata({ params }: AssessmentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as Locale : 'es';
  const dict = await getPageDictionary(validLocale, 'organizations/[slug]/(organization)/assessments');
  
  return {
    title: `${dict.title || 'Assessments'} | Minery`,
    description: dict.description || '',
  };
}

interface AssessmentsPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// EvolutionChart is now imported from components

export default async function AssessmentsPage({ params }: AssessmentsPageProps) {
  const session = await auth();
  const { locale, slug } = await params;
  const validLocale = isValidLocale(locale) ? locale as Locale : 'es';
  
  // Load page translations
  const dict = await getPageDictionary(validLocale, 'organizations/[slug]/(organization)/assessments');

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch evaluations for the organization using API
  const assessmentsResponse = await AssessmentApi.getOrganizationAssessments(organizationId);
  const averagesResponse = await AssessmentApi.getGlobalAverageScores();
  
  const evaluations = assessmentsResponse.assessments || [];
  const globalAverages = averagesResponse.averages || {
    avgPersonas: 50,
    avgProcesos: 50,
    avgSistemas: 50,
    avgTotal: 50,
    totalEvaluations: 0,
  };

  // Calculate metrics
  const metrics = AssessmentApi.calculateMetrics(evaluations as Assessment[]);
  const currentScores = metrics.latestScores;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <ClipboardCheck className="h-6 w-6 text-primary flex-shrink-0" />
            <OrganizationPageTitle
              title={dict.title || 'Cybersecurity Assessment'}
              info={dict.description || 'Evaluate your organization\'s cybersecurity maturity'}
            />
          </div>
          <PageActions className="flex-shrink-0">
            <Link
              href={`/organizations/${slug}/assessments/new`}
              className={buttonVariants({ variant: 'default' })}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{dict.actions?.newAssessment || 'New Assessment'}</span>
              <span className="sm:hidden">New</span>
            </Link>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="w-full max-w-full mx-auto lg:max-w-7xl space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 overflow-x-hidden box-border">

      {/* Quick Insights Section */}
      {evaluations.length > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 min-w-0 max-w-full">
          <Card className="border-l-4 border-l-primary min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription>{dict.stats?.overallScore || 'Current Score'}</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {currentScores.total}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {currentScores.total >= 70 ? (dict.status?.completed || 'Healthy') : currentScores.total >= 40 ? (dict.status?.inProgress || 'Needs Improvement') : (dict.status?.pending || 'Critical')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription>{dict.stats?.comparedToAverage || 'vs Global Average'}</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                {currentScores.total > globalAverages.avgTotal ? '+' : ''}{(currentScores.total - globalAverages.avgTotal).toFixed(0)}%
                {currentScores.total > globalAverages.avgTotal ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : currentScores.total < globalAverages.avgTotal ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {dict.stats?.averageScore || 'Global avg'}: {globalAverages.avgTotal}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription>{dict.results?.weaknesses || 'Weakest Area'}</CardDescription>
              <CardTitle className="text-lg">
                {currentScores.personas <= currentScores.procesos && currentScores.personas <= currentScores.sistemas
                  ? (dict.categories?.personas || 'People')
                  : currentScores.procesos <= currentScores.sistemas
                  ? (dict.categories?.procesos || 'Processes')
                  : (dict.categories?.sistemas || 'Systems')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {dict.metrics?.score || 'Score'}: {Math.min(currentScores.personas, currentScores.procesos, currentScores.sistemas)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription>{dict.stats?.totalAssessments || 'Total Assessments'}</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {evaluations.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {evaluations.length > 1 ? `${dict.common?.since || 'Since'} ${new Date(evaluations[evaluations.length - 1].createdAt).toLocaleDateString(validLocale)}` : (dict.messages?.firstAssessment || 'First assessment')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assessment Statistics Section - Main focus */}
      {evaluations.length > 0 && (
        <Suspense fallback={<LoadingCard />}>
          <AssessmentStatsWrapper 
            userScores={{
              total: currentScores.total,
              personas: currentScores.personas,
              procesos: currentScores.procesos,
              sistemas: currentScores.sistemas
            }}
            className="mt-6"
            translations={dict}
          />
        </Suspense>
      )}

      {/* Evolution Chart - Full Width */}
      <Suspense fallback={<LoadingCard />}>
        <EvolutionChart data={evaluations} translations={dict} locale={locale} />
      </Suspense>

      {/* Service Upsell if Score is Low or No Assessments - moved to bottom */}
      {(evaluations.length === 0 || currentScores.total < 60) && (
        <Card className="border-warning bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-950/20 dark:to-yellow-950/20 border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle className="text-lg">
                    {evaluations.length === 0 
                      ? (dict.messages?.noAssessmentWarning || "You haven't completed an assessment yet")
                      : (dict.messages?.lowScoreWarning || 'Your score indicates significant risks')}
                  </CardTitle>
                  <CardDescription>
                    {evaluations.length === 0
                      ? (dict.messages?.noAssessmentDescription || "Complete your first assessment to understand your organization's cybersecurity maturity level")
                      : (dict.messages?.lowScoreDescription?.replace('{{score}}', currentScores.total.toString()) || `With ${currentScores.total}% maturity, your organization is exposed to cyberattacks`)}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Link
                href={`/organizations/${slug}/services#maturity-analysis`}
                className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full sm:w-auto' })}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{dict.actions?.getProfessionalAnalysis || 'Get Professional Analysis'}</span>
                <span className="sm:hidden">Professional Analysis</span>
              </Link>
              <Link
                href={`/organizations/${slug}/services#ciso-service`}
                className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full sm:w-auto' })}
              >
                <span className="hidden sm:inline">{dict.actions?.hireCISO || 'Hire Virtual CISO'}</span>
                <span className="sm:hidden">Virtual CISO</span>
              </Link>
              <Link
                href={`/organizations/${slug}/services#managed-security`}
                className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full sm:w-auto' })}
              >
                <span className="hidden sm:inline">{dict.actions?.viewProtectionServices || 'View 24/7 Protection Services'}</span>
                <span className="sm:hidden">24/7 Protection</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Data Table */}
      <Suspense fallback={<LoadingCard />}>
        <Card>
          <CardHeader>
            <CardTitle>{dict.chart?.history || 'Assessment History'}</CardTitle>
            <CardDescription>
              {dict.chart?.historyDescription || 'All assessments performed by your organization with detailed evolution'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <AssessmentsTanstackTable
              assessments={evaluations}
              organizationSlug={slug}
              translations={dict}
              locale={locale}
            />
          </CardContent>
        </Card>
      </Suspense>
        </div>
      </PageBody>
    </Page>
  );
}
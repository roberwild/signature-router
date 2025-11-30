import { Metadata } from 'next';

import { redirect } from 'next/navigation';
import { Shield,  Edit, FileSpreadsheet } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';

import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import Link from 'next/link';

import { CIS18Api } from '~/src/features/cis18/data/cis18-api';
import { CIS18ViewToggle } from '~/src/features/cis18/components/cis18-view-toggle';
import { ScoreBadge } from '~/src/features/cis18/components/score-badge';

import { EmptyStateCIS18 } from '~/src/features/cis18/components/empty-state-cis18';
import { ImportButton } from '~/src/features/cis18/components/import-button';
import { TestDataButton } from '~/src/features/cis18/components/test-data-button';

export const metadata: Metadata = {
  title: 'CIS-18 | Auditoría Externa de Ciberseguridad',
  description: 'Resultados de la auditoría externa CIS-18 de tu organización',
};

interface CIS18PageProps {
  params: Promise<{
    slug: string;
  }>;
}
// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  trend: _
}: {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function CIS18Page({ params }: CIS18PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch CIS-18 assessments for the organization (plural now)
  const assessments = await CIS18Api.getAllCIS18Assessments(organizationId);
  const hasAssessment = assessments.length > 0;
  
  // Get the latest assessment for display
  const latestAssessment = assessments[0];

  // Calculate overall score if assessment exists
  const overallScore = latestAssessment ? CIS18Api.calculateTotalScore(latestAssessment) : 0;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="CIS-18"
              info="Auditoría externa de cumplimiento con los controles CIS"
            />
            {hasAssessment && (
              <ScoreBadge score={overallScore} />
            )}
          </div>
          {hasAssessment && (
            <PageActions>
              <Link href={`/organizations/${slug}/cis-18/new`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Entrada Manual
                </Button>
              </Link>
              <ImportButton organizationId={organizationId} />
              <Button variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <TestDataButton 
                organizationId={organizationId} 
                userId={session.user.id!}
              />
            </PageActions>
          )}
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {!hasAssessment ? (
            <EmptyStateCIS18 
              slug={slug} 
              organizationId={organizationId}
              userId={session.user.id!}
            />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-6 lg:grid-cols-4">
                <StatsCard
                  title="Puntuación Total"
                  value={`${overallScore}%`}
                  description="Promedio de todos los controles"
                />
                <StatsCard
                  title="Controles Evaluados"
                  value="18"
                  description="Controles CIS críticos"
                />
                <StatsCard
                  title="Última Evaluación"
                  value={new Date(latestAssessment.assessmentDate).toLocaleDateString('es-ES')}
                  description="Fecha de auditoría"
                />
                <StatsCard
                  title="Total Evaluaciones"
                  value={assessments.length}
                  description="Registros históricos"
                />
              </div>

              {/* Assessment Results with View Toggle */}
              <CIS18ViewToggle 
                data={assessments}
                organizationSlug={slug}
                userId={session.user.id!}
              />
            </>
          )}
        </div>
      </PageBody>
    </Page>
  );
}
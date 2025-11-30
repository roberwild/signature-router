import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { ClipboardCheck } from 'lucide-react';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { LoadingCard } from '~/components/organizations/slug/home/loading-card';
import { AssessmentForm } from '~/src/features/assessments/components/assessment-form';

export const metadata: Metadata = {
  title: 'Nueva Evaluación de Ciberseguridad | Minery',
  description: 'Realiza una nueva evaluación de ciberseguridad para tu organización',
};

interface NewAssessmentPageProps {
  params: {
    slug: string;
  };
}

export default async function NewAssessmentPage({ params }: NewAssessmentPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organization = ctx.organization;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Nueva Evaluación de Ciberseguridad"
              info="Evalúa la madurez en ciberseguridad de tu organización"
            />
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <Suspense fallback={<LoadingCard />}>
            <AssessmentForm
              organizationId={organization.id}
              organizationSlug={slug}
              userEmail={session.user.email!}
              userName={session.user.name!}
              userId={session.user.id!}
            />
          </Suspense>
        </div>
      </PageBody>
    </Page>
  );
}
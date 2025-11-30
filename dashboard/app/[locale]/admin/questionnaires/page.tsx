import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { QuestionnairesPageHeader } from './questionnaires-page-header';
import { QuestionnairesWrapper } from './questionnaires-wrapper';

export const metadata: Metadata = {
  title: 'Questionnaire Management | Minery Admin',
  description: 'Configure and monitor lead qualification questionnaires',
};

export default async function QuestionnairesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  await requirePlatformAdmin();

  const { locale } = await params;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <QuestionnairesPageHeader />
        </PagePrimaryBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          <QuestionnairesWrapper locale={locale} />
        </div>
      </PageBody>
    </Page>
  );
}
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Onboarding Questionnaire Management',
  description: 'Manage the onboarding questionnaire for lead qualification'
};

export default async function OnboardingQuestionnairePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to the main questionnaire config page
  // The onboarding questionnaire should be managed from there
  redirect(`/${locale}/admin/questionnaires/config`);
}
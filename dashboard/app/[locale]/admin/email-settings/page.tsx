import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { platformEmailSettingsTable } from '@workspace/database/schema';
import { eq } from '@workspace/database';
import type { EmailSettingsFormData } from './types';
import { initializeEmailSettingsFromEnv, needsEmailSettingsInitialization } from '~/lib/email/initialize-email-settings';
import { EmailSettingsWrapper } from './email-settings-wrapper';

export const metadata: Metadata = {
  title: 'Email Settings | Admin Panel',
  description: 'Configure email providers and settings',
};

async function getEmailSettings() {
  // Check if we need to initialize from environment variables
  const needsInit = await needsEmailSettingsInitialization();

  if (needsInit) {
    console.log('No email settings found, attempting to initialize from environment variables...');
    const initResult = await initializeEmailSettingsFromEnv();

    if (initResult.initialized) {
      console.log('✅ Email settings initialized from environment variables');
    }
  }

  const settings = await db
    .select()
    .from(platformEmailSettingsTable)
    .where(eq(platformEmailSettingsTable.isActive, true))
    .limit(1);

  return settings[0] || null;
}

interface EmailSettingsPageProps {
  params: { locale: string };
}

export default async function EmailSettingsPage({ params }: EmailSettingsPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  await requirePlatformAdmin();

  const currentSettings = await getEmailSettings();

  return (
    <EmailSettingsWrapper
      locale={params.locale}
      currentSettings={currentSettings ? {
        ...currentSettings,
        emailFromName: currentSettings.emailFromName || undefined,
        feedbackInbox: currentSettings.feedbackInbox || undefined,
        replyTo: currentSettings.replyTo || undefined
      } as EmailSettingsFormData & { id?: string } : undefined}
    />
  );
}
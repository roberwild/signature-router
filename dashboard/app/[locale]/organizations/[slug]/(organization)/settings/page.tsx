import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale, slug } = await params;
  
  // Redirect to the default settings page (Profile)
  redirect(`/${locale}/organizations/${slug}/settings/account/profile`);
}
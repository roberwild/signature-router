import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { ConfigurationWrapper } from './configuration-wrapper';

export const metadata: Metadata = {
  title: 'Configuration | Admin Panel',
  description: 'Manage platform configuration and environment variables',
};

interface AdminConfigurationPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    page?: string;
    userId?: string;
    configKey?: string;
  }>;
}

export default async function AdminConfigurationPage({ params, searchParams }: AdminConfigurationPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  await requirePlatformAdmin();

  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ConfigurationWrapper
      locale={locale}
      searchParams={resolvedSearchParams}
    />
  );
}
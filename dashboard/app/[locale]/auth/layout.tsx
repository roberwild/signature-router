import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getRequestStoragePathname } from '@workspace/auth/redirect';
import { baseUrl, getPathname, routes } from '@workspace/routes';
import { Logo } from '@workspace/ui/components/logo';
import { ThemeToggle } from '@workspace/ui/components/theme-toggle';

import { createTitle } from '~/lib/formatters';
import { safeAuth } from '~/lib/auth-wrapper';

export const metadata: Metadata = {
  title: createTitle('Auth')
};

function isChangeEmailRoute(): boolean {
  const pathname = getRequestStoragePathname();
  return (
    !!pathname &&
    pathname.startsWith(
      getPathname(routes.dashboard.auth.changeEmail.Index, baseUrl.Dashboard)
    )
  );
}

interface AuthLayoutProps extends React.PropsWithChildren {
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({
  children,
  params
}: AuthLayoutProps): Promise<React.JSX.Element> {
  let session;
  try {
    session = await safeAuth();
  } catch (error: unknown) {
    // If database connection fails, import and render ServiceUnavailable directly
    if ((error as Error)?.message?.includes('Database connection failed')) {
      const ServiceUnavailable = (await import('~/app/service-unavailable/page')).default;
      return <ServiceUnavailable />;
    }
    throw error;
  }

  const { locale } = await params;

  if (!isChangeEmailRoute() && session) {
    // Redirect to organizations page with locale prefix
    return redirect(`/${locale}/organizations`);
  }

  return (
    <main className="h-screen dark:bg-background bg-gray-50 px-4">
      <div className="mx-auto w-full min-w-[320px] space-y-6 py-12 max-w-sm">
        <Link
          href={routes.marketing.Index}
          className="block w-fit mx-auto"
        >
          <Logo />
        </Link>
        {children}
      </div>
      <ThemeToggle className="fixed bottom-2 right-2 rounded-full" />
    </main>
  );
}

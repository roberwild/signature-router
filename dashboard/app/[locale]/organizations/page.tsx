import * as React from 'react';
import { type Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@workspace/routes';
import { Logo } from '@workspace/ui/components/logo';
import { ThemeSwitcher } from '@workspace/ui/components/theme-switcher';

import { SignOutButton } from '~/components/onboarding/sign-out-button';
import { OrganizationList } from '~/components/organizations/organization-list';
import { getOrganizations } from '~/data/organization/get-organizations';
import { createTitle } from '~/lib/formatters';
import { getPageDictionary, type Locale } from '~/lib/i18n';
import { isPlatformAdmin } from '~/data/user/get-platform-admin-status';

export const metadata: Metadata = {
  title: createTitle('Organizations')
};

interface OrganizationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrganizationsPage({ 
  params 
}: OrganizationsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const organizations = await getOrganizations();
  const dict = await getPageDictionary(locale as Locale, 'organizations');
  const isAdmin = await isPlatformAdmin();
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-10 mx-auto flex min-w-80 items-center justify-center bg-background p-4">
        <Link href={routes.marketing.Index}>
          <Logo />
        </Link>
      </div>
      <div className="relative mx-auto flex w-full min-w-80 max-w-lg flex-col items-stretch justify-start gap-6 pt-28">
        {isAdmin && (
          <div className="px-4">
            <Link
              href={`/${locale}/admin`}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-shield"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
              {dict.adminPanel || 'Admin Panel'}
            </Link>
          </div>
        )}
        <OrganizationList organizations={organizations} locale={locale as Locale} translations={dict} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="whitespace-nowrap">
                {dict.footer?.copyright?.replace('{year}', new Date().getFullYear().toString()) || `© ${new Date().getFullYear()} Minery Report S.L.`}
              </span>
              <span className="hidden sm:inline">•</span>
              <div className="flex gap-3">
                <Link
                  prefetch={false}
                  href="https://mineryreport.com/aviso-legal/"
                  className="underline hover:text-foreground"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dict.footer?.legalNotice || 'Aviso Legal'}
                </Link>
                <Link
                  prefetch={false}
                  href="https://mineryreport.com/politica-de-privacidad/"
                  className="underline hover:text-foreground"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dict.footer?.privacy || 'Privacidad'}
                </Link>
                <Link
                  prefetch={false}
                  href="https://mineryreport.com/politica-de-cookies/"
                  className="underline hover:text-foreground"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dict.footer?.cookies || 'Cookies'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SignOutButton
                type="button"
                variant="link"
                className="h-fit rounded-none p-0 text-xs font-normal text-muted-foreground underline hover:text-foreground"
              >
                {dict.footer?.signOut || 'Cerrar sesión'}
              </SignOutButton>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

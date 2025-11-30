import * as React from 'react';
import { type Metadata } from 'next';
import Link from 'next/link';

import { SignUpCard } from '~/components/auth/sign-up/sign-up-card';
import { createTitle } from '~/lib/formatters';
import { getPageDictionary, Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Sign up')
};

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignUpPage({ params }: SignUpPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const dict = await getPageDictionary(locale as Locale, 'auth');
  return (
    <>
      <SignUpCard />
      <div className="px-2 text-xs text-muted-foreground text-center">
        {dict.signUp?.legal?.bySigningUp || 'Al registrarte, aceptas nuestro'}{' '}
        <Link
          prefetch={false}
          href="https://mineryreport.com/aviso-legal/"
          className="text-foreground underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.signUp?.legal?.legalNotice || 'Aviso Legal'}
        </Link>
        ,{' '}
        <Link
          prefetch={false}
          href="https://mineryreport.com/politica-de-privacidad/"
          className="text-foreground underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.signUp?.legal?.privacyPolicy || 'Política de Privacidad'}
        </Link>
        {' '}{locale === 'es' ? 'y' : 'and'}{' '}
        <Link
          prefetch={false}
          href="https://mineryreport.com/politica-de-cookies/"
          className="text-foreground underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.signUp?.legal?.cookiePolicy || 'Política de Cookies'}
        </Link>
        .
      </div>
    </>
  );
}

import * as React from 'react';
import { type Metadata } from 'next';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { VerifyEmailCard } from '~/components/auth/verify-email/verify-email-card';
import { createTitle } from '~/lib/formatters';
import { sendVerificationEmail } from '~/actions/auth/send-verification-email';

const searchParamsCache = createSearchParamsCache({
  email: parseAsString.withDefault(''),
  from: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Verificar Correo')
};

export default async function VerifyEmailPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  console.log('[VerifyEmailPage] SearchParams received:', searchParams);
  const { email: rawEmail, from } = await searchParamsCache.parse(searchParams);

  // Decode the email parameter (handles %40 -> @)
  const email = rawEmail ? decodeURIComponent(rawEmail) : '';

  console.log('[VerifyEmailPage] Raw email from URL:', rawEmail);
  console.log('[VerifyEmailPage] Decoded email:', email);

  if (email && email.includes('@') && from === 'signin') {
    console.log('[VerifyEmailPage] Auto-sending verification email for:', email);
    await sendVerificationEmail(email);
  } else if (email && email.includes('@')) {
    console.log('[VerifyEmailPage] Not auto-sending (not from signin)');
  }

  return <VerifyEmailCard email={email} />;
}

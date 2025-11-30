import * as React from 'react';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@workspace/routes';

import { createTitle } from '~/lib/formatters';
import { safeGetAuthContext } from '~/lib/auth-context-wrapper';

export const metadata: Metadata = {
  title: createTitle('Organizations')
};

export default async function OrganizationsLayout(
  props: React.PropsWithChildren
): Promise<React.JSX.Element> {
  let ctx;
  try {
    ctx = await safeGetAuthContext();
  } catch (error: unknown) {
    // If database connection fails, import and render ServiceUnavailable directly
    if ((error as Error)?.message?.includes('Database connection failed')) {
      const ServiceUnavailable = (await import('~/app/service-unavailable/page')).default;
      return <ServiceUnavailable />;
    }
    throw error;
  }
  
  if (!ctx.session.user.completedOnboarding) {
    return redirect(routes.dashboard.onboarding.Index);
  }

  return <>{props.children}</>;
}

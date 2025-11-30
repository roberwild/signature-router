import * as React from 'react';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

type NextPageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const createTitle = (title: string) => title;

const _paramsCache = createSearchParamsCache({
  slug: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Organization')
};

export default async function UnmatchedRouteRedirectToOrgHomePage(
  props: NextPageProps
): Promise<React.JSX.Element> {
  const { locale, slug } = await props.params;

  return redirect(`/${locale}/organizations/${slug}/home`);
}

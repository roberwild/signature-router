import { MarketingLayout } from '~/components/marketing/layout';
import { Hero } from '~/components/marketing/hero-new';
import { Logos } from '~/components/marketing/logos';
import { Problem } from '~/components/marketing/problem';
import { Solution } from '~/components/marketing/solution';

import { FAQ } from '~/components/marketing/faq';
import { CTA } from '~/components/marketing/cta';

interface MarketingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale } = await params;
  
  // Show marketing page for all visitors
  // Auth check will be handled by individual protected pages
  return (
    <MarketingLayout locale={locale}>
      <Hero />
      <Logos />
      <Problem />
      <Solution />
      {/* <Stats /> */}
      {/* <Testimonials /> */}
      <FAQ />
      <CTA />
    </MarketingLayout>
  );
}
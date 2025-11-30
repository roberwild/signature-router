import { MarketingLayout } from '~/components/marketing/layout';
import { Hero } from '~/components/marketing/hero';
import { Logos } from '~/components/marketing/logos';
import { Problem } from '~/components/marketing/problem';
import { Solution } from '~/components/marketing/solution';
import { Stats } from '~/components/marketing/stats';
import { Testimonials } from '~/components/marketing/testimonials';
import { FAQ } from '~/components/marketing/faq';
import { CTA } from '~/components/marketing/cta';

export default function RootPage() {
  // Show marketing page for all visitors
  // Auth check will be handled by individual protected pages
  return (
    <MarketingLayout locale="en">
      <Hero />
      <Logos />
      <Problem />
      <Solution />
      <Stats />
      <Testimonials />
      <FAQ />
      <CTA />
    </MarketingLayout>
  );
}
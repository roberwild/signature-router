import { MetadataRoute } from 'next';
import { baseUrl } from '@workspace/routes';
import { locales } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/organizations',
    '/organizations/[slug]/home',
    '/organizations/[slug]/assessments',
    '/organizations/[slug]/incidents',
    '/organizations/[slug]/cis-18',
    '/organizations/[slug]/services',
    '/organizations/[slug]/settings',
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Generate URLs for each locale
  for (const locale of locales) {
    for (const route of routes) {
      sitemap.push({
        url: `${baseUrl.Dashboard}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map(l => [l, `${baseUrl.Dashboard}/${l}${route}`])
          ),
        },
      });
    }
  }

  return sitemap;
}
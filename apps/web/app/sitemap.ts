import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealos.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/deals',
    '/coupons',
    '/clearance',
    '/categories',
    '/merchants',
    '/search',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/rss.xml'
  ];
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'hourly',
    priority: route === '' ? 1 : 0.7
  }));
}

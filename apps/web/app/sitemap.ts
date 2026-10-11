import type { MetadataRoute } from 'next';
import { prisma, activeDealWhere } from '@dealos/database';
export const dynamic = 'force-dynamic';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealos.ai';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [deals, categories, merchants] = await Promise.all([
    prisma.deal.findMany({
      where: activeDealWhere(),
      select: { slug: true, updatedAt: true },
      take: 10000,
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.merchant.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  const routes = [
    '',
    '/deals',
    '/coupons',
    '/clearance',
    '/categories',
    '/merchants',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];
  return [
    ...routes.map((route) => ({ url: `${siteUrl}${route}`, priority: route === '' ? 1 : 0.7 })),
    ...deals.map((item) => ({
      url: `${siteUrl}/deals/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
    })),
    ...categories.map((item) => ({
      url: `${siteUrl}/categories/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
    })),
    ...merchants.map((item) => ({
      url: `${siteUrl}/merchants/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
    })),
  ];
}

export const siteConfig = {
  name: 'DealOS',
  description:
    'AI-powered shopping intelligence platform for verified deals, coupons, price tracking, and buying confidence.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealos.ai',
  defaultLocale: 'en_US',
  twitterHandle: '@dealos',
  contactEmail: 'support@dealos.ai'
} as const;

export const primaryNavItems = [
  { href: '/deals', label: 'Deals' },
  { href: '/coupons', label: 'Coupons' },
  { href: '/clearance', label: 'Clearance' },
  { href: '/categories', label: 'Categories' },
  { href: '/merchants', label: 'Merchants' },
  { href: '/search', label: 'Search' }
] as const;

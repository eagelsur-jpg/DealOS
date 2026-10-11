export const siteConfig = {
  name: 'DealOS',
  description: 'Browse deals, coupons, merchants, and recorded prices.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealos.ai',
  defaultLocale: 'en_US',
  twitterHandle: '@dealos',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'support@dealos.ai',
} as const;

export const primaryNavItems = [
  { href: '/deals', label: 'Deals' },
  { href: '/coupons', label: 'Coupons' },
  { href: '/clearance', label: 'Clearance' },
  { href: '/categories', label: 'Categories' },
  { href: '/merchants', label: 'Merchants' },
  { href: '/search', label: 'Search' },
] as const;

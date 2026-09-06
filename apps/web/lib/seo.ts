export const absoluteUrl = (path: string): string => {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealos.ai';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

export const breadcrumbsJsonLd = (items: Array<{ name: string; item: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.name,
    item: absoluteUrl(entry.item)
  }))
});

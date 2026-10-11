import { getDealsListing } from '@/lib/server/catalog';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

const xmlText = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
  );

export async function GET() {
  const deals = await getDealsListing({
    mode: 'newest',
    page: 1,
    pageSize: 30,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>DealOS Latest Deals</title>
    <link>${absoluteUrl('/')}</link>
    <description>Latest deals and shopping intelligence updates from DealOS.</description>
    ${deals.items
      .map(
        (deal) => `
    <item>
      <title><![CDATA[${xmlText(deal.title)}]]></title>
      <link>${xmlText(absoluteUrl(`/deals/${deal.slug}`))}</link>
      <guid>${xmlText(absoluteUrl(`/deals/${deal.slug}`))}</guid>
      <description><![CDATA[${xmlText(deal.merchantName)} · ${deal.currentPrice}]]></description>
    </item>`,
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
    },
  });
}

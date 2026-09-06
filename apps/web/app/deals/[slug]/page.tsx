import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  BadgePercent,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Ticket,
  TrendingDown
} from 'lucide-react';
import { calculateSavingsPercent, formatCurrency } from '@dealos/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Container, H1, MutedText } from '@dealos/ui';
import { AffiliateButton } from '@/components/affiliate-button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DealCard } from '@/components/deal-card';
import { JsonLd } from '@/components/json-ld';
import { PriceHistoryChart } from '@/components/price-history-chart';
import { ProductImage } from '@/components/product-image';
import { createPageMetadata } from '@/lib/metadata';
import { getDealBySlug } from '@/lib/server/catalog';
import { absoluteUrl, breadcrumbsJsonLd } from '@/lib/seo';

interface DealDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DealDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const details = await getDealBySlug(slug);
  if (!details) {
    return createPageMetadata({
      title: 'Deal Not Found',
      description: 'Deal no longer available.',
      path: `/deals/${slug}`
    });
  }

  return createPageMetadata({
    title: `${details.deal.title} — DealOS Intelligence`,
    description: details.deal.description ?? `Track ${details.deal.title} with price history and verified merchant data.`,
    path: `/deals/${slug}`
  });
}

export const revalidate = 120;
export const dynamic = 'force-dynamic';

export default async function DealDetailsPage({ params }: DealDetailsPageProps) {
  const { slug } = await params;
  const details = await getDealBySlug(slug);

  if (!details) {
    notFound();
  }

  const { deal, priceHistory, relatedDeals } = details;
  const discountPercent = calculateSavingsPercent(deal.previousPrice, deal.currentPrice);
  const savingsAmount = deal.previousPrice ? Number(deal.previousPrice) - Number(deal.currentPrice) : 0;

  const faqItems = [
    {
      question: `How long is ${deal.title} expected to stay active?`,
      answer: deal.endsAt
        ? `Based on merchant feed telemetry, this offer is scheduled to expire on ${new Date(deal.endsAt).toLocaleDateString()}.`
        : 'No explicit expiration date was specified by the merchant feed. DealOS continually verifies availability.'
    },
    {
      question: 'Is this an authenticated merchant deal?',
      answer:
        'Yes. DealOS lists merchant-verified offers and includes full affiliate disclosure, price history logs, and click transparency.'
    },
    {
      question: 'How often is price history updated?',
      answer:
        'Price monitoring algorithms scan feeds multiple times daily to log accurate historical pricing and trigger deal alerts.'
    }
  ];

  return (
    <Container className="space-y-12 py-10">
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: 'Home', item: '/' },
          { name: 'Deals', item: '/deals' },
          { name: deal.title, item: `/deals/${deal.slug}` }
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: deal.product.name,
          description: deal.description ?? deal.title,
          brand: deal.merchant.name,
          category: deal.product.category?.name,
          offers: {
            '@type': 'Offer',
            price: deal.currentPrice,
            priceCurrency: deal.currency,
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: deal.merchant.name
            },
            url: absoluteUrl(`/deals/${deal.slug}`)
          }
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Offer',
          name: deal.title,
          price: deal.currentPrice,
          priceCurrency: deal.currency,
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Product',
            name: deal.product.name
          },
          seller: {
            '@type': 'Organization',
            name: deal.merchant.name
          },
          url: absoluteUrl(`/deals/${deal.slug}`)
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer
            }
          }))
        }}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Deals', href: '/deals' },
          { label: deal.title }
        ]}
      />

      {/* Main Deal Hero Workspace */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* Left Aspect: Product Media Preview */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
            <ProductImage src={deal.product.imageUrl} alt={deal.title} />

            {/* Badges Overlay */}
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              {discountPercent > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-rose-600/90 px-3 py-1 text-xs font-extrabold text-white shadow-lg backdrop-blur-md">
                  <BadgePercent className="h-4 w-4" />
                  {Math.round(discountPercent)}% OFF
                </span>
              ) : null}
              {deal.coupons.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-400/95 px-3 py-1 text-xs font-extrabold text-amber-950 shadow-lg backdrop-blur-md">
                  <Ticket className="h-4 w-4" />
                  Coupon Available
                </span>
              ) : null}
            </div>

            {/* Merchant Overlay Chip */}
            <div className="absolute bottom-4 left-4 z-10">
              <Link
                href={`/merchants/${deal.merchant.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-black/90 hover:scale-105"
              >
                <Store className="h-3.5 w-3.5 text-teal-400" />
                {deal.merchant.name}
              </Link>
            </div>
          </div>

          {/* Quick Specifications Pill Bar */}
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 text-xs backdrop-blur-xs">
            {deal.product.category ? (
              <Link href={`/categories/${deal.product.category.slug}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400">
                <Tag className="h-3.5 w-3.5" />
                {deal.product.category.name}
              </Link>
            ) : null}
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Score: {deal.score.toFixed(1)}/100
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Verified Deal
            </span>
          </div>
        </div>

        {/* Right Aspect: Deal Purchasing & Intelligence Panel */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <Sparkles className="h-3.5 w-3.5" />
              DealOS Intelligence Verified
            </div>

            <H1 className="text-2xl sm:text-3xl lg:text-4xl leading-tight font-extrabold">{deal.title}</H1>
            <MutedText className="text-sm sm:text-base leading-relaxed">
              {deal.description ?? 'Verified merchant offer with real-time price monitoring and coupon code verification.'}
            </MutedText>
          </div>

          {/* Pricing Highlight Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Price</p>
                <p className="text-4xl font-extrabold tracking-tight text-foreground">{formatCurrency(deal.currentPrice)}</p>
              </div>

              {deal.previousPrice && savingsAmount > 0 ? (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-teal-500/15 px-3 py-1 text-xs font-extrabold text-teal-600 dark:text-teal-400">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Save {formatCurrency(savingsAmount)} ({Math.round(discountPercent)}%)
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Was <span className="line-through">{formatCurrency(deal.previousPrice)}</span>
                  </p>
                </div>
              ) : null}
            </div>

            {/* Coupons list */}
            {deal.coupons.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  <Ticket className="h-4 w-4" />
                  Promo Coupon Code
                </p>
                {deal.coupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 shadow-2xs border border-amber-500/20">
                    <div>
                      <span className="font-mono text-sm font-extrabold text-foreground select-all">{coupon.code}</span>
                      {coupon.description ? <p className="text-xs text-muted-foreground">{coupon.description}</p> : null}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* CTA Buttons */}
            <div className="pt-2">
              <AffiliateButton
                affiliateLinkId={deal.affiliateLinks[0]?.id ?? null}
                dealSlug={deal.slug}
                merchantSlug={deal.merchant.slug}
              />
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
              Affiliate link redirect includes click verification. DealOS earns qualifying merchant commissions.
            </p>
          </div>

          {/* Telemetry Summary Card */}
          <Card className="rounded-2xl">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Deal Metadata Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-bold capitalize text-foreground">{deal.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Merchant:</span>
                <p className="font-bold text-foreground">{deal.merchant.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Recorded Clicks:</span>
                <p className="font-bold text-foreground">{deal._count.clicks} total clicks</p>
              </div>
              <div>
                <span className="text-muted-foreground">Product SKUs:</span>
                <p className="font-bold text-foreground">{deal.product.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Price History Section */}
      <section>
        <PriceHistoryChart priceHistory={priceHistory} currentPrice={deal.currentPrice} />
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Frequently Asked Questions
          </h2>
          <MutedText className="text-sm">Verified insights about this merchant offer</MutedText>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
              <p className="font-semibold text-sm text-foreground">{item.question}</p>
              <MutedText className="text-xs leading-relaxed">{item.answer}</MutedText>
            </div>
          ))}
        </div>
      </section>

      {/* Related Deals */}
      {relatedDeals.length ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Related Deals</h2>
              <MutedText className="text-sm">More offers in {deal.product.category?.name ?? 'similar categories'}</MutedText>
            </div>
            <Link href="/deals">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                View all deals
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedDeals.map((related) => (
              <DealCard key={related.id} deal={related} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}

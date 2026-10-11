import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Search as SearchIcon,
  ShieldCheck,
  Store,
  Tag,
  Ticket,
} from 'lucide-react';
import { Button, Container, MutedText } from '@dealos/ui';
import { DealCard } from '@/components/deal-card';
import { EmptyState } from '@/components/empty-state';
import { JsonLd } from '@/components/json-ld';
import { NewsletterForm } from '@/components/newsletter-form';
import { createPageMetadata } from '@/lib/metadata';
import { getHomePageData } from '@/lib/server/catalog';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Home',
  description:
    'Discover trending deals, latest coupons, and shopping intelligence backed by DealOS.',
  path: '/',
});

export const revalidate = 300;
export const dynamic = 'force-dynamic';

const sectionMeta = {
  trending: 'High-signal offers rising fastest across DealOS.',
  featured: 'Editorial picks with catalog pricing and merchant context.',
  newest: 'Freshly added deals sorted for quick scanning.',
  categories: 'Browse tracked categories with active shopping intelligence.',
  merchants: 'Compare trusted sellers by live deal and coupon inventory.',
  coupons: 'The latest active codes and merchant promotions.',
};

const SectionHeader = ({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) => (
  <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">{title}</h2>
      <MutedText className="mt-1 max-w-2xl text-sm leading-relaxed">{subtitle}</MutedText>
    </div>
    <Link href={href}>
      <Button variant="outline" size="sm" className="gap-2 text-xs">
        View all
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </Link>
  </div>
);

type HomeDeals = Awaited<ReturnType<typeof getHomePageData>>['trendingDeals'];

const DealGrid = ({ deals }: { deals: HomeDeals }) =>
  deals.length ? (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No deals to show yet"
      message="Fresh deal intelligence will appear here as soon as the catalog has matching offers."
    />
  );

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div className="overflow-hidden">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DealOS',
          url: absoluteUrl('/'),
          potentialAction: {
            '@type': 'SearchAction',
            target: `${absoluteUrl('/search')}?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Hero Section */}
      <section className="relative border-b border-border/50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.18),rgba(9,9,11,0))] py-16 lg:py-24">
        <Container className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
              </span>
              <span>Deal Catalog</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl text-foreground">
                Shop smarter with <br />
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 dark:from-teal-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  recorded merchant offers.
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
                Browse merchant offers, compare recorded prices, and check current availability
                before purchasing.
              </p>
            </div>

            <form
              action="/search"
              className="flex max-w-2xl flex-col gap-2 rounded-2xl border border-border/80 bg-card/80 p-2 shadow-xl shadow-black/5 backdrop-blur-md sm:flex-row sm:items-center"
            >
              <label htmlFor="hero-search" className="sr-only">
                Search deals
              </label>
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="hero-search"
                  name="q"
                  placeholder="Search laptops, Nike, headphones, coupon codes..."
                  className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  ⌘K
                </kbd>
              </div>
              <Button variant="brand" className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold">
                Search
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: 'Verified merchants', icon: ShieldCheck },
                { label: 'Active coupons', icon: Ticket },
                { label: 'Price-aware scoring', icon: BadgeCheck },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon
                    className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400"
                    aria-hidden="true"
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/40 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    DealOS Live Intelligence
                  </p>
                  <p className="text-xl font-bold tracking-tight text-foreground">
                    Market Signal Summary
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
                  Active
                </span>
              </div>
              <div className="grid gap-3">
                {[
                  {
                    label: 'Trending Deals',
                    value: data.trendingDeals.length,
                    tag: 'High Velocity',
                  },
                  {
                    label: 'Featured Picks',
                    value: data.featuredDeals.length,
                    tag: 'Editor Verified',
                  },
                  { label: 'Newest Offers', value: data.newestDeals.length, tag: 'Just Added' },
                  { label: 'Active Coupons', value: data.latestCoupons.length, tag: 'Validated' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 p-3.5 transition-colors hover:bg-secondary/60"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {item.tag}
                      </p>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content Sections */}
      <Container className="space-y-16 lg:space-y-24 py-16">
        <section>
          <SectionHeader
            title="Trending Deals"
            subtitle={sectionMeta.trending}
            href="/deals?mode=trending"
          />
          <DealGrid deals={data.trendingDeals} />
        </section>

        <section>
          <SectionHeader
            title="Featured Picks"
            subtitle={sectionMeta.featured}
            href="/deals?mode=featured"
          />
          <DealGrid deals={data.featuredDeals} />
        </section>

        <section>
          <SectionHeader
            title="Newest Arrivals"
            subtitle={sectionMeta.newest}
            href="/deals?mode=newest"
          />
          <DealGrid deals={data.newestDeals} />
        </section>

        <section>
          <SectionHeader
            title="Popular Categories"
            subtitle={sectionMeta.categories}
            href="/categories"
          />
          {data.categories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg"
                >
                  <div>
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform group-hover:scale-110">
                      <Tag className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <p className="font-semibold text-foreground text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {category.name}
                    </p>
                  </div>
                  <MutedText className="text-xs mt-2">
                    {category._count.products} tracked products
                  </MutedText>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No categories yet"
              message="Tracked shopping categories will appear here shortly."
            />
          )}
        </section>

        <section>
          <SectionHeader
            title="Merchant Network"
            subtitle={sectionMeta.merchants}
            href="/merchants"
          />
          {data.merchants.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/merchants/${merchant.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg"
                >
                  <div>
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110">
                      <Store className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <p className="font-semibold text-foreground text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {merchant.name}
                    </p>
                  </div>
                  <MutedText className="text-xs mt-2">{merchant._count.deals} live deals</MutedText>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No merchants yet"
              message="Trusted merchant profiles will appear as catalog data grows."
            />
          )}
        </section>

        <section>
          <SectionHeader title="Verified Coupons" subtitle={sectionMeta.coupons} href="/coupons" />
          {data.latestCoupons.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.latestCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-border"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-base font-bold text-foreground">{coupon.code}</p>
                      <MutedText className="text-xs">{coupon.merchant.name}</MutedText>
                    </div>
                    <span className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
                      <Ticket className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <MutedText className="line-clamp-2 text-xs min-h-[2.5rem]">
                    {coupon.description ?? 'Merchant promotion code'}
                  </MutedText>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No coupons right now"
              message="Active coupon codes will surface here once merchants publish them."
            />
          )}
        </section>

        {/* Newsletter Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-secondary/50 p-8 shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Stay ahead of price drops.
              </h2>
              <MutedText className="text-sm leading-relaxed max-w-md">
                Subscribe to receive shopping updates when available.
              </MutedText>
            </div>
            <div>
              <NewsletterForm />
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-8 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              DealOS Community
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Join smart deal hunters.
            </h2>
            <MutedText className="max-w-xl text-sm leading-relaxed">
              Ask questions, discuss offer authenticity, and suggest categories for deeper tracking.
            </MutedText>
          </div>
          <Link
            href="https://www.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="brand" size="lg" className="gap-2 font-semibold">
              Join community
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </section>
      </Container>
    </div>
  );
}

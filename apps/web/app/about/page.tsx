import type { Metadata } from 'next';
import { Bot, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { Card, Container, H1, MutedText, Text } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'About',
  description: 'Learn about DealOS and our mission to build transparent shopping intelligence.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container className="space-y-12 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <Sparkles className="h-3.5 w-3.5" />
          Shopping Intelligence Platform
        </div>
        <H1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">About DealOS</H1>
        <Text className="text-lg text-muted-foreground leading-relaxed">
          DealOS is a deal catalog with recorded prices, merchant listings, and affiliate links.
        </Text>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <TrendingDown className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Recorded Prices</h3>
          <MutedText className="text-xs leading-relaxed">
            Price history shows stored observations. Confirm the latest prices on the merchant
            website.
          </MutedText>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Merchant Transparency</h3>
          <MutedText className="text-xs leading-relaxed">
            Outbound affiliate links include a disclosure. Recorded click counts are available;
            seller reputation verification is not configured.
          </MutedText>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Deal Scoring</h3>
          <MutedText className="text-xs leading-relaxed">
            Listings use stored ranking scores. Automatic score recalculation is not currently
            scheduled.
          </MutedText>
        </Card>
      </div>
    </Container>
  );
}

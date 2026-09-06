import type { Metadata } from 'next';
import { Bot, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { Card, Container, H1, MutedText, Text } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'About',
  description: 'Learn about DealOS and our mission to build transparent shopping intelligence.',
  path: '/about'
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
          DealOS is an AI-driven shopping intelligence engine dedicated to consumer transparency, verified pricing history, and merchant integrity.
        </Text>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <TrendingDown className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Verified Price Drops</h3>
          <MutedText className="text-xs leading-relaxed">
            Our historical pricing telemetry tracks real price fluctuations, helping consumers avoid inflated fake discount baseline traps.
          </MutedText>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Merchant Transparency</h3>
          <MutedText className="text-xs leading-relaxed">
            Every deal and merchant listing features explicit affiliate disclosure, click auditing, and verified seller reputation metrics.
          </MutedText>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">AI Deal Scoring</h3>
          <MutedText className="text-xs leading-relaxed">
            Proprietary scoring algorithms aggregate historical discount magnitude, coupon validity, and merchant score to rank high-signal offers.
          </MutedText>
        </Card>
      </div>
    </Container>
  );
}

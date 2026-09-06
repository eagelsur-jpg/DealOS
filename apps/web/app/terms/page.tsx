import type { Metadata } from 'next';
import { FileText, Info, Scale } from 'lucide-react';
import { Card, Container, H1, MutedText, Text } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Terms of Service',
  description: 'DealOS platform terms of use and affiliate disclosure standards.',
  path: '/terms'
});

export default function TermsPage() {
  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms' }]} />

      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <FileText className="h-3.5 w-3.5" />
          Terms of Service
        </div>
        <H1 className="text-4xl font-extrabold tracking-tight">Terms of Service</H1>
        <MutedText className="text-base">
          Please review the terms and conditions governing the use of DealOS price tracking and intelligence services.
        </MutedText>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Info className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Informational Service & Price Accuracy
          </div>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            DealOS provides deal discovery and price history data for informational purposes. Final transaction terms, pricing, stock levels, and coupon code redemptions remain under the exclusive control of respective merchant stores.
          </Text>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Scale className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Affiliate Disclosure & Transparency
          </div>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            Outbound links to online store products may be affiliate links. DealOS may receive qualifying merchant commissions when users make purchases, at zero additional cost to the shopper.
          </Text>
        </Card>
      </div>
    </Container>
  );
}

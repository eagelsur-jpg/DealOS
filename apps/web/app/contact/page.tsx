import type { Metadata } from 'next';
import { Clock, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { Card, Container, H1, MutedText } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Contact',
  description: 'Contact DealOS support, affiliate partnerships, and editorial team.',
  path: '/contact'
});

export default function ContactPage() {
  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />

      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <MessageSquare className="h-3.5 w-3.5" />
          Get In Touch
        </div>
        <H1 className="text-4xl font-extrabold tracking-tight">Contact DealOS</H1>
        <MutedText className="text-base">
          Have feedback on a deal, merchant partnership inquiry, or technical support question? Reach out directly.
        </MutedText>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Card className="rounded-2xl p-6 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">User Support & Inquiries</h3>
            <MutedText className="text-xs mt-1">Questions regarding deal listings, price alerts, or site feedback.</MutedText>
            <a href="mailto:support@dealos.ai" className="mt-3 inline-block font-mono text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline">
              support@dealos.ai
            </a>
          </div>
        </Card>

        <Card className="rounded-2xl p-6 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Merchant Partnerships</h3>
            <MutedText className="text-xs mt-1">Feed integration, affiliate network partnerships, and merchant verification.</MutedText>
            <a href="mailto:partners@dealos.ai" className="mt-3 inline-block font-mono text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline">
              partners@dealos.ai
            </a>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-xl border border-border/60 bg-card p-4 max-w-xl">
        <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>Our support team monitors inquiries continuously and responds within 1-2 business days.</span>
      </div>
    </Container>
  );
}

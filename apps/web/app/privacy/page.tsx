import type { Metadata } from 'next';
import { Lock, Shield, UserCheck } from 'lucide-react';
import { Card, Container, H1, MutedText, Text } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy',
  description: 'How DealOS collects, stores, and protects user data and analytics.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />

      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <Shield className="h-3.5 w-3.5" />
          Data Governance & Privacy
        </div>
        <H1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</H1>
        <MutedText className="text-base">
          Last updated: August 2026. DealOS respects user privacy and enforces strict data minimization principles.
        </MutedText>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Data Collection & Telemetry
          </div>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            DealOS collects anonymized operational analytics, search interaction signals, and user-submitted email addresses strictly for product functionality—including search autocomplete relevance, deal attribution verification, and newsletter notifications.
          </Text>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <UserCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Zero Data Sale Guarantee
          </div>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            We do not sell personal data to third parties under any circumstances. Outbound click events are monitored for merchant link attribution and click fraud prevention.
          </Text>
        </Card>

        <Card className="rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-base text-foreground">User Rights & Erasure Requests</h3>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            You may request complete data deletion or unsubscribe from newsletters at any time by emailing{' '}
            <a href="mailto:privacy@dealos.ai" className="font-mono text-teal-600 dark:text-teal-400 underline">
              privacy@dealos.ai
            </a>
            .
          </Text>
        </Card>
      </div>
    </Container>
  );
}

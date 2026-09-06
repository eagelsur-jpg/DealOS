import Link from 'next/link';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import { verifyNewsletterToken } from '@/lib/server/newsletter';

export const dynamic = 'force-dynamic';

export default async function NewsletterVerifyPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  const isVerified = token ? await verifyNewsletterToken(token) : false;

  return (
    <Container className="space-y-6 py-20 text-center">
      <H1>{isVerified ? 'Subscription confirmed' : 'Verification failed'}</H1>
      <MutedText>
        {isVerified
          ? 'Your newsletter subscription is now active.'
          : 'This verification link is invalid or expired. Please subscribe again.'}
      </MutedText>
      <Link href="/">
        <Button>Back to homepage</Button>
      </Link>
    </Container>
  );
}

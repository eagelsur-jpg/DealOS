'use client';

import Link from 'next/link';
import { Button } from '@dealos/ui';
import { trackEvent } from '@/lib/analytics';

interface AffiliateButtonProps {
  affiliateLinkId: string | null;
  dealSlug: string;
  merchantSlug: string;
}

export const AffiliateButton = ({ affiliateLinkId, dealSlug, merchantSlug }: AffiliateButtonProps) => {
  if (!affiliateLinkId) {
    return (
      <Button variant="secondary" disabled>
        Link unavailable
      </Button>
    );
  }

  return (
    <Link
      href={`/r/${affiliateLinkId}`}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={() => {
        trackEvent('affiliate_click', { deal_slug: dealSlug, merchant_slug: merchantSlug, placement: 'deal_page' });
      }}
    >
      <Button>View deal at merchant</Button>
    </Link>
  );
};

export const isOfferAvailable = (
  deal: { status: string; isHidden: boolean; startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
): boolean =>
  deal.status === 'ACTIVE' &&
  !deal.isHidden &&
  (!deal.startsAt || deal.startsAt <= now) &&
  (!deal.endsAt || deal.endsAt > now);

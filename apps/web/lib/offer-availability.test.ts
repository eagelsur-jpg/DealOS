import { describe, expect, it } from 'vitest';
import { isOfferAvailable } from './offer-availability';

const now = new Date('2026-10-11T12:00:00Z');
const active = { status: 'ACTIVE', isHidden: false, startsAt: null, endsAt: null };

describe('saved offer availability for public details', () => {
  it('shows an active offer without a configured end date', () => {
    expect(isOfferAvailable(active, now)).toBe(true);
  });
  it('expires an ACTIVE status at the exact end boundary', () => {
    expect(isOfferAvailable({ ...active, endsAt: now }, now)).toBe(false);
  });
  it('does not activate a future scheduled offer', () => {
    expect(isOfferAvailable({ ...active, startsAt: new Date(now.getTime() + 1) }, now)).toBe(false);
  });
  it('activates at the inclusive start boundary', () => {
    expect(isOfferAvailable({ ...active, startsAt: now }, now)).toBe(true);
  });
  it('never enables expired or hidden catalog entries', () => {
    expect(isOfferAvailable({ ...active, status: 'EXPIRED' }, now)).toBe(false);
    expect(isOfferAvailable({ ...active, isHidden: true }, now)).toBe(false);
  });
});

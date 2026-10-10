import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { AffiliateEngine, assertSafeAffiliateDestination } from './affiliate-engine.js';

describe('affiliate engine commission recording', () => {
  it('rejects unsafe redirect destinations', () => {
    expect(() => assertSafeAffiliateDestination('javascript:alert(1)')).toThrow('not permitted');
    expect(() => assertSafeAffiliateDestination('https://127.0.0.1/private')).toThrow('not permitted');
  });

  it('upserts commission events that have a provider order ID', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'commission-1' });
    const create = vi.fn();
    const prisma = {
      commissionEvent: { upsert, create }
    } as unknown as PrismaClient;

    await new AffiliateEngine(prisma).recordCommission({
      affiliateLinkId: 'link-1',
      clickId: 'click-1',
      orderId: 'order-1',
      amount: 12.5
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        affiliateLinkId_orderId: {
          affiliateLinkId: 'link-1',
          orderId: 'order-1'
        }
      },
      update: {
        clickId: 'click-1',
        amount: 12.5,
        currency: 'USD',
        status: 'PENDING'
      },
      create: {
        affiliateLinkId: 'link-1',
        orderId: 'order-1',
        clickId: 'click-1',
        amount: 12.5,
        currency: 'USD',
        status: 'PENDING'
      }
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('records events without an order ID without collapsing distinct events', async () => {
    const upsert = vi.fn();
    const create = vi.fn().mockResolvedValue({ id: 'commission-2' });
    const prisma = {
      commissionEvent: { upsert, create }
    } as unknown as PrismaClient;

    await new AffiliateEngine(prisma).recordCommission({
      affiliateLinkId: 'link-1',
      amount: 12.5
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        affiliateLinkId: 'link-1',
        orderId: null,
        clickId: null,
        amount: 12.5,
        currency: 'USD',
        status: 'PENDING'
      }
    });
    expect(upsert).not.toHaveBeenCalled();
  });
});

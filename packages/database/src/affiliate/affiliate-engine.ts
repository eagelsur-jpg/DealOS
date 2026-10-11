import type { PrismaClient } from '@prisma/client';
import { CommissionStatus } from '@prisma/client';
import type { AffiliateNetwork } from '@prisma/client';
import { AppError } from '@dealos/utils';

export interface RedirectContext {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
}

export interface CommissionEventInput {
  affiliateLinkId: string;
  clickId?: string;
  orderId?: string;
  amount: number;
  currency?: string;
  status?: CommissionStatus;
}

const networkTrackingParams: Record<AffiliateNetwork, string> = {
  AMAZON: '',
  IMPACT: 'irclickid={clickId}',
  CJ: 'sid={clickId}',
  AWIN: 'clickref={clickId}',
  PARTNERIZE: 'clickref={clickId}',
  SHAREASALE: 'afftrack={clickId}',
  CUSTOM: 'click={clickId}',
};

const isPrivateIpv4Address = (hostname: string): boolean => {
  const octets = hostname.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
  );
};

export const assertSafeAffiliateDestination = (destination: string): string => {
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    throw new AppError('Affiliate destination is invalid', {
      statusCode: 400,
      code: 'UNSAFE_AFFILIATE_DESTINATION',
    });
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    /(?:^|\/)example(?:\/|$)/i.test(url.pathname) ||
    /(^|\.)example\.(com|org|net)$/i.test(hostname) ||
    url.username ||
    url.password ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    isPrivateIpv4Address(hostname) ||
    hostname.includes(':') ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new AppError('Affiliate destination is not permitted', {
      statusCode: 400,
      code: 'UNSAFE_AFFILIATE_DESTINATION',
    });
  }

  return url.toString();
};

export class AffiliateEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async buildRedirectUrl(affiliateLinkId: string, clickId: string): Promise<string> {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id: affiliateLinkId },
    });
    if (!link || !link.isActive) {
      throw new AppError('Affiliate link not available', {
        statusCode: 404,
        code: 'AFFILIATE_LINK_NOT_FOUND',
      });
    }

    const template = link.trackingTemplate || link.destinationUrl;
    if (template.includes('{clickId}')) {
      return assertSafeAffiliateDestination(template.replaceAll('{clickId}', clickId));
    }

    const url = new URL(assertSafeAffiliateDestination(template));
    const params = new URLSearchParams(
      networkTrackingParams[link.network].replace('{clickId}', encodeURIComponent(clickId)),
    );
    for (const [key, value] of params) url.searchParams.set(key, value);
    return assertSafeAffiliateDestination(url.toString());
  }

  async trackClick(affiliateLinkId: string, context: RedirectContext = {}) {
    const link = await this.prisma.affiliateLink.findUnique({ where: { id: affiliateLinkId } });
    if (!link || !link.isActive) {
      throw new AppError('Affiliate link not found', {
        statusCode: 404,
        code: 'AFFILIATE_LINK_NOT_FOUND',
      });
    }

    await this.buildRedirectUrl(affiliateLinkId, 'validation');
    const merchant = await this.prisma.merchant.findUnique({ where: { id: link.merchantId } });
    if (!merchant?.isActive)
      throw new AppError('Merchant is inactive', {
        statusCode: 404,
        code: 'AFFILIATE_LINK_NOT_FOUND',
      });
    if (link.dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: link.dealId } });
      const now = new Date();
      if (
        !deal ||
        deal.status !== 'ACTIVE' ||
        deal.isHidden ||
        (deal.startsAt && deal.startsAt > now) ||
        (deal.endsAt && deal.endsAt <= now)
      ) {
        throw new AppError('Deal is unavailable', {
          statusCode: 404,
          code: 'AFFILIATE_LINK_NOT_FOUND',
        });
      }
    }
    const click = await this.prisma.click.create({
      data: {
        affiliateLinkId,
        dealId: link.dealId,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        sessionId: context.sessionId ?? null,
      },
    });

    return {
      clickId: click.id,
      redirectUrl: await this.buildRedirectUrl(affiliateLinkId, click.id),
    };
  }

  async recordCommission(input: CommissionEventInput) {
    const data = {
      clickId: input.clickId ?? null,
      amount: input.amount,
      currency: input.currency ?? 'USD',
      status: input.status ?? CommissionStatus.PENDING,
    };

    if (input.orderId) {
      return this.prisma.commissionEvent.upsert({
        where: {
          affiliateLinkId_orderId: {
            affiliateLinkId: input.affiliateLinkId,
            orderId: input.orderId,
          },
        },
        update: data,
        create: {
          affiliateLinkId: input.affiliateLinkId,
          orderId: input.orderId,
          ...data,
        },
      });
    }

    return this.prisma.commissionEvent.create({
      data: {
        affiliateLinkId: input.affiliateLinkId,
        orderId: null,
        ...data,
      },
    });
  }
}

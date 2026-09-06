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
  AMAZON: 'tag=dealos-20',
  IMPACT: 'irclickid={clickId}',
  CJ: 'sid={clickId}',
  AWIN: 'clickref={clickId}',
  PARTNERIZE: 'clickref={clickId}',
  SHAREASALE: 'afftrack={clickId}',
  CUSTOM: 'click={clickId}'
};

export class AffiliateEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async buildRedirectUrl(affiliateLinkId: string, clickId: string): Promise<string> {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id: affiliateLinkId }
    });
    if (!link || !link.isActive) {
      throw new AppError('Affiliate link not available', {
        statusCode: 404,
        code: 'AFFILIATE_LINK_NOT_FOUND'
      });
    }

    const template = link.trackingTemplate || link.destinationUrl;
    if (template.includes('{clickId}')) {
      return template.replaceAll('{clickId}', clickId);
    }

    const separator = template.includes('?') ? '&' : '?';
    return `${template}${separator}${networkTrackingParams[link.network].replace('{clickId}', clickId)}`;
  }

  async trackClick(affiliateLinkId: string, context: RedirectContext = {}) {
    const link = await this.prisma.affiliateLink.findUnique({ where: { id: affiliateLinkId } });
    if (!link) {
      throw new AppError('Affiliate link not found', {
        statusCode: 404,
        code: 'AFFILIATE_LINK_NOT_FOUND'
      });
    }

    const click = await this.prisma.click.create({
      data: {
        affiliateLinkId,
        dealId: link.dealId,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        sessionId: context.sessionId ?? null
      }
    });

    return {
      clickId: click.id,
      redirectUrl: await this.buildRedirectUrl(affiliateLinkId, click.id)
    };
  }

  async recordCommission(input: CommissionEventInput) {
    return this.prisma.commissionEvent.create({
      data: {
        affiliateLinkId: input.affiliateLinkId,
        clickId: input.clickId ?? null,
        orderId: input.orderId ?? null,
        amount: input.amount,
        currency: input.currency ?? 'USD',
        status: input.status ?? CommissionStatus.PENDING
      }
    });
  }
}

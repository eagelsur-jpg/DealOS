import type { PrismaClient } from '@prisma/client';
import { NewsletterStatus } from '@prisma/client';

export class NewsletterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createPending(input: {
    email: string;
    verificationHash: string;
    verificationExpiresAt: Date;
    source?: string;
  }) {
    return this.prisma.newsletterSubscription.upsert({
      where: { email: input.email.toLowerCase() },
      update: {
        status: NewsletterStatus.PENDING,
        verificationHash: input.verificationHash,
        verificationSentAt: new Date(),
        verificationExpiresAt: input.verificationExpiresAt,
        source: input.source ?? null,
        unsubscribedAt: null
      },
      create: {
        email: input.email.toLowerCase(),
        verificationHash: input.verificationHash,
        verificationSentAt: new Date(),
        verificationExpiresAt: input.verificationExpiresAt,
        source: input.source ?? null
      }
    });
  }

  verifySubscription(hash: string) {
    return this.prisma.newsletterSubscription.updateMany({
      where: {
        verificationHash: hash,
        verificationExpiresAt: {
          gt: new Date()
        },
        status: NewsletterStatus.PENDING
      },
      data: {
        status: NewsletterStatus.SUBSCRIBED,
        verifiedAt: new Date(),
        verificationHash: null
      }
    });
  }
}

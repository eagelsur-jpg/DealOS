import { createHash, randomBytes } from 'node:crypto';
import { NewsletterRepository, prisma } from '@dealos/database';
import { z } from 'zod';
import { Resend } from 'resend';
import { siteConfig } from '@/lib/site';

const newsletterSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional()
});

const repository = new NewsletterRepository(prisma);

const hashToken = (value: string): string => createHash('sha256').update(value).digest('hex');

const getNewsletterEnv = () => newsletterSchema.parse(process.env);

export const createNewsletterSubscription = async (email: string, source?: string) => {
  const env = getNewsletterEnv();
  const token = randomBytes(24).toString('hex');
  const verificationHash = hashToken(token);
  const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const subscription = await repository.createPending({
    email,
    verificationHash,
    verificationExpiresAt,
    source
  });

  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const verificationUrl = `${baseUrl}/newsletter/verify?token=${token}`;
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [subscription.email],
    subject: 'Confirm your DealOS newsletter subscription',
    html: `
      <p>Thanks for joining DealOS.</p>
      <p>Please confirm your email to activate deal alerts and weekly shopping intelligence updates.</p>
      <p><a href="${verificationUrl}">Confirm subscription</a></p>
      <p>This link expires in 24 hours.</p>
    `
  });

  return {
    email: subscription.email,
    verificationSentAt: subscription.verificationSentAt
  };
};

export const verifyNewsletterToken = async (token: string) => {
  const verificationHash = hashToken(token);
  const result = await repository.verifySubscription(verificationHash);
  return result.count > 0;
};

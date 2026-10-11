import { z } from 'zod';

export const dealCreateSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  productId: z.string().min(1),
  merchantId: z.string().min(1),
  currentPrice: z.number().positive(),
  previousPrice: z.number().positive().optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('USD'),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'HIDDEN']).default('DRAFT'),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  source: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isHot: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  score: z.number().min(0).max(100).default(0),
});

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'HIDDEN']).optional(),
});

export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;

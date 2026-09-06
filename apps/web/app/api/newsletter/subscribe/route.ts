import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createNewsletterSubscription } from '@/lib/server/newsletter';

const payloadSchema = z.object({
  email: z.string().email(),
  source: z.string().max(64).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Invalid newsletter subscription payload.'
      },
      { status: 422 },
    );
  }

  const result = await createNewsletterSubscription(parsed.data.email, parsed.data.source);
  return NextResponse.json(result, { status: 201 });
}

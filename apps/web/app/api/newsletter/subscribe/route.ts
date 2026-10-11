import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createNewsletterSubscription } from '@/lib/server/newsletter';

const payloadSchema = z.object({
  email: z.string().email(),
  source: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Invalid newsletter subscription payload.',
      },
      { status: 422 },
    );
  }

  try {
    const result = await createNewsletterSubscription(parsed.data.email, parsed.data.source);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Newsletter signup is temporarily unavailable.' },
      { status: 503 },
    );
  }
}

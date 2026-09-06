'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, MutedText } from '@dealos/ui';
import { trackEvent } from '@/lib/analytics';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailPattern.test(email)) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, source: 'homepage' })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ message: 'Subscription failed.' }))) as {
        message?: string;
      };
      setStatus('error');
      setMessage(payload.message ?? 'Subscription failed.');
      return;
    }

    trackEvent('newsletter_subscribe', { source: 'homepage' });
    setStatus('success');
    setMessage('Verification email sent. Please confirm your subscription.');
    setEmail('');
  };

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : 'Subscribe'}
        </Button>
      </div>
      {message ? <MutedText>{message}</MutedText> : null}
    </form>
  );
};

'use client';

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export const trackEvent = (name: string, payload: AnalyticsPayload = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.gtag?.('event', name, payload);
  window.clarity?.('event', name);
};

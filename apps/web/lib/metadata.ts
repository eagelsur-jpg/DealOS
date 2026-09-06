import type { Metadata } from 'next';
import { siteConfig } from './site';

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — AI Shopping Intelligence`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.defaultLocale,
    title: `${siteConfig.name} — AI Shopping Intelligence`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — AI Shopping Intelligence`,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle
  }
};

export const createPageMetadata = (input: {
  title: string;
  description: string;
  path: string;
}): Metadata => ({
  title: input.title,
  description: input.description,
  alternates: {
    canonical: input.path
  },
  openGraph: {
    title: `${input.title} | ${siteConfig.name}`,
    description: input.description,
    url: input.path
  },
  twitter: {
    title: `${input.title} | ${siteConfig.name}`,
    description: input.description
  }
});

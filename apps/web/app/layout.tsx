import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer, Navbar } from '@dealos/ui';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { baseMetadata } from '@/lib/metadata';
import { primaryNavItems, siteConfig } from '@/lib/site';

export const metadata: Metadata = baseMetadata;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {ga4Id ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
            <Script id="ga4-script" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga4Id}');`}
            </Script>
          </>
        ) : null}
        {clarityId ? (
          <Script id="clarity-script" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`}
          </Script>
        ) : null}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar brand={siteConfig.name} items={[...primaryNavItems]} rightSlot={<ThemeToggle />} />
          <main>{children}</main>
          <Footer
            links={[
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' }
            ]}
            copyright={`© ${new Date().getFullYear()} DealOS. All rights reserved.`}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

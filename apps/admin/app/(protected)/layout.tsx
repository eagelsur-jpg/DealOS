import { Button } from '@dealos/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/products', label: 'Products' },
  { href: '/deals', label: 'Deals' },
  { href: '/analytics', label: 'Analytics' }
];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_1fr]">
      <aside className="border-r bg-muted/40">
        <div className="border-b p-4">
          <h1 className="font-semibold">DealOS Admin</h1>
        </div>
        <nav className="space-y-1 p-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="post" className="p-2">
          <Button variant="outline" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}

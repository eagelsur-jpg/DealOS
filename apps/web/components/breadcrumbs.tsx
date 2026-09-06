import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb" className="text-xs font-medium text-muted-foreground">
    <ol className="flex flex-wrap items-center gap-1.5">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" /> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {isFirst ? <Home className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={`px-1.5 py-0.5 ${isLast ? 'font-semibold text-foreground' : ''}`}>
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);


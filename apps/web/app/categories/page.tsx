import Link from 'next/link';
import { ArrowRight, Layers, Tag } from 'lucide-react';
import { Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { EmptyState } from '@/components/empty-state';
import { createPageMetadata } from '@/lib/metadata';
import { getCategoriesPageData } from '@/lib/server/catalog';

export const metadata: Metadata = createPageMetadata({
  title: 'Categories',
  description: 'Explore shopping categories with curated deal discovery and price monitoring.',
  path: '/categories'
});

export const revalidate = 900;
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getCategoriesPageData();

  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <Layers className="h-4 w-4" />
          Shopping Intelligence Categories
        </div>
        <H1>Browse Categories</H1>
        <MutedText className="text-base max-w-2xl">
          Explore category-level deal intelligence, tracked products, and price drop opportunities across top retail verticals.
        </MutedText>
      </div>

      {categories.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
                    {category.name}
                  </h2>
                  <MutedText className="text-xs mt-1">
                    {category._count.products} products actively tracked
                  </MutedText>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <span>View Category Deals</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories found" message="Tracked category groups will surface here soon." />
      )}
    </Container>
  );
}

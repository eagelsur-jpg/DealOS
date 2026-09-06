'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Filter, Search, SlidersHorizontal, Tag, Store } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, MutedText } from '@dealos/ui';
import { formatCurrency } from '@dealos/utils';
import { trackEvent } from '@/lib/analytics';
import { Skeleton } from '@dealos/ui';

interface SearchItem {
  slug: string;
  title: string;
  merchantName: string;
  currentPrice: number;
  previousPrice: number | null;
}

interface SearchPayload {
  items: SearchItem[];
  page: number;
  totalPages: number;
}

interface AutocompleteItem {
  type: 'deal' | 'product' | 'merchant' | 'coupon' | 'category';
  value: string;
  label: string;
}

const sortOptions = [
  { value: 'score-desc', label: 'Best ranked' },
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' }
];

const parseSort = (value: string): { field?: string; direction?: string } => {
  const [field, direction] = value.split('-');
  if (!field || !direction) {
    return {};
  }

  return { field, direction };
};

export const SearchExperience = ({
  initialQuery,
  initialCategory,
  initialMerchant
}: {
  initialQuery: string;
  initialCategory?: string;
  initialMerchant?: string;
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory ?? '');
  const [merchant, setMerchant] = useState(initialMerchant ?? '');
  const [sort, setSort] = useState('score-desc');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState<AutocompleteItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canLoadMore = page < totalPages && !loading;
  const { field, direction } = useMemo(() => parseSort(sort), [sort]);

  const fetchSearch = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!query.trim()) {
        setItems([]);
        setTotalPages(1);
        setPage(1);
        return;
      }

      setLoading(true);
      const searchParams = new URLSearchParams({
        q: query,
        page: String(nextPage),
        pageSize: '12'
      });
      if (field && direction) {
        searchParams.set('sortField', field);
        searchParams.set('sortDirection', direction);
      }
      if (category) {
        searchParams.set('category', category);
      }
      if (merchant) {
        searchParams.set('merchant', merchant);
      }

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        setErrorMessage('Search request failed. Please try again.');
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as SearchPayload;
      setErrorMessage('');
      setItems((current) => (append ? [...current, ...payload.items] : payload.items));
      setPage(payload.page);
      setTotalPages(payload.totalPages);
      setLoading(false);
    },
    [category, direction, field, merchant, query],
  );

  useEffect(() => {
    fetchSearch(1, false).catch((error: unknown) => {
      setLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Search request failed.');
    });
  }, [fetchSearch]);

  useEffect(() => {
    if (!query.trim()) {
      setAutocomplete([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=6`)
        .then((response) => response.json() as Promise<AutocompleteItem[]>)
        .then((payload) => setAutocomplete(payload))
        .catch((error: unknown) => {
          setAutocomplete([]);
          setErrorMessage(error instanceof Error ? error.message : 'Autocomplete request failed.');
        });
    }, 150);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !canLoadMore) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting) {
        fetchSearch(page + 1, true).catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load more results.');
        });
      }
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, [canLoadMore, fetchSearch, page]);

  return (
    <section className="space-y-8">
      {/* Floating Filter Card Container */}
      <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <SlidersHorizontal className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
            <span>Search & Filter Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Sort by</span>
            <select
              className="rounded-xl border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, deals, coupons..."
                value={query}
                className="pl-10 pr-12 h-11 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-teal-500/50"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    trackEvent('search_submit', { query });
                    fetchSearch(1, false).catch((error: unknown) => {
                      setErrorMessage(error instanceof Error ? error.message : 'Search request failed.');
                    });
                  }
                }}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {autocomplete.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute z-20 mt-2 w-full rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</p>
                  {autocomplete.map((item) => (
                    <button
                      key={`${item.type}-${item.value}`}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                      onClick={() => {
                        setQuery(item.label);
                        trackEvent('search_autocomplete_click', { type: item.type, value: item.value });
                      }}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 capitalize">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Category slug"
              value={category}
              className="pl-10 h-11 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-teal-500/50"
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category slug"
            />
          </div>

          <div className="relative">
            <Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Merchant slug"
              value={merchant}
              className="pl-10 h-11 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-teal-500/50"
              onChange={(event) => setMerchant(event.target.value)}
              aria-label="Filter by merchant slug"
            />
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end">
          <Button
            variant="brand"
            className="h-10 px-6 gap-2 text-xs font-semibold rounded-xl"
            onClick={() => {
              trackEvent('search_submit', { query, category, merchant, sort });
              fetchSearch(1, false).catch((error: unknown) => {
                setErrorMessage(error instanceof Error ? error.message : 'Search request failed.');
              });
            }}
          >
            Apply Filters
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {loading && items.length === 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card/60 p-12 text-center shadow-2xs backdrop-blur-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">No matching deals found</h3>
          <MutedText className="mt-1 max-w-sm mx-auto text-xs">
            Try adjusting your search terms or clearing your category and merchant filters to see more results.
          </MutedText>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <motion.div
            key={item.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="group flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg">
              <CardHeader className="p-0 space-y-1.5">
                <CardTitle className="text-base font-bold leading-snug">
                  <Link href={`/deals/${item.slug}`} className="transition-colors hover:text-teal-600 dark:hover:text-teal-400">
                    {item.title}
                  </Link>
                </CardTitle>
                <MutedText className="text-xs">{item.merchantName}</MutedText>
              </CardHeader>
              <CardContent className="p-0 pt-4 flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-foreground">{formatCurrency(item.currentPrice)}</p>
                  {item.previousPrice ? <MutedText className="text-xs">Was <span className="line-through">{formatCurrency(item.previousPrice)}</span></MutedText> : null}
                </div>
                <Link href={`/deals/${item.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs">View</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-6" />
      {loading && items.length > 0 ? <MutedText className="text-center text-xs">Loading more deals…</MutedText> : null}
      {errorMessage ? <MutedText className="text-center text-xs text-rose-500">{errorMessage}</MutedText> : null}
    </section>
  );
};

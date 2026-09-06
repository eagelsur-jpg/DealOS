'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgePercent, ExternalLink, Store, Ticket } from 'lucide-react';
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, MutedText } from '@dealos/ui';
import { calculateSavingsPercent, formatCurrency } from '@dealos/utils';
import type { DealCardData } from '@/lib/server/catalog';
import { ProductImage } from '@/components/product-image';

export const DealCard = ({ deal }: { deal: DealCardData }) => {
  const savingsPercent = calculateSavingsPercent(deal.previousPrice, deal.currentPrice);
  const hasDiscount = deal.previousPrice && savingsPercent > 0;
  const savingsAmount = deal.previousPrice ? Number(deal.previousPrice) - Number(deal.currentPrice) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileTap={{ scale: 0.99 }}
      className="h-full"
    >
      <Card className="group relative flex h-full min-h-[510px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10">
        {/* Top Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border/40 bg-muted/60">
          <ProductImage src={deal.productImageUrl} alt={deal.productName} />
          {/* Subtle Bottom Gradient Overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

          {/* Floating Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
            {hasDiscount ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-rose-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
                <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" />
                {Math.round(savingsPercent)}% OFF
              </span>
            ) : null}
            {deal.couponCode ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-400/90 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold text-amber-950 shadow-md">
                <Ticket className="h-3.5 w-3.5 animate-pulse text-amber-950" aria-hidden="true" />
                Coupon
              </span>
            ) : null}
          </div>

          {/* Floating Merchant Chip over image bottom-left */}
          <div className="absolute bottom-2.5 left-3 z-10">
            <Link
              href={`/merchants/${deal.merchantSlug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-white transition-all hover:bg-black/80 hover:scale-105"
            >
              <Store className="h-3 w-3 text-teal-400" aria-hidden="true" />
              {deal.merchantName}
            </Link>
          </div>
        </div>

        {/* Card Content Header */}
        <CardHeader className="p-5 pb-2 space-y-2">
          <CardTitle className="line-clamp-2 min-h-[3rem] text-base font-bold leading-snug tracking-tight">
            <Link href={`/deals/${deal.slug}`} className="transition-colors hover:text-teal-600 dark:hover:text-teal-400">
              {deal.title}
            </Link>
          </CardTitle>
        </CardHeader>

        {/* Card Body */}
        <CardContent className="flex flex-1 flex-col justify-end space-y-3 p-5 pt-0">
          <MutedText className="line-clamp-1 text-xs">{deal.productName}</MutedText>

          {/* Pricing Block */}
          <div className="rounded-xl border border-border/50 bg-secondary/40 p-3.5 backdrop-blur-xs transition-colors group-hover:border-teal-500/20 group-hover:bg-secondary/70">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{formatCurrency(deal.currentPrice)}</p>
              {hasDiscount && savingsAmount > 0 ? (
                <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  Save {formatCurrency(savingsAmount)}
                </span>
              ) : null}
            </div>
            {deal.previousPrice ? (
              <MutedText className="text-xs mt-0.5">
                Was <span className="line-through">{formatCurrency(deal.previousPrice)}</span>
              </MutedText>
            ) : null}
          </div>

          {/* Coupon Code Block */}
          {deal.couponCode ? (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-background/60 px-3 py-1.5 text-xs backdrop-blur-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Code</span>
              <span className="font-mono font-bold text-foreground select-all">{deal.couponCode}</span>
            </div>
          ) : null}
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="grid grid-cols-2 gap-2 p-5 pt-0">
          <Link href={`/deals/${deal.slug}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
              Details
            </Button>
          </Link>
          {deal.affiliateLinkId ? (
            <Link href={`/r/${deal.affiliateLinkId}`} target="_blank" rel="nofollow sponsored noopener" className="w-full">
              <Button variant="brand" size="sm" className="w-full gap-1 text-xs font-semibold">
                Shop now
                <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
              </Button>
            </Link>
          ) : (
            <Link href={`/deals/${deal.slug}`} className="w-full">
              <Button variant="default" size="sm" className="w-full text-xs font-semibold">
                View deal
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

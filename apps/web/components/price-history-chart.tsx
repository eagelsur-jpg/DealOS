'use client';

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@dealos/utils';

export interface PricePoint {
  id: string;
  price: number | string;
  recordedAt: Date | string;
}

export const PriceHistoryChart = ({
  priceHistory,
  currentPrice
}: {
  priceHistory: PricePoint[];
  currentPrice: number | string;
}) => {
  const parsedHistory = React.useMemo(() => {
    return priceHistory
      .map((entry) => ({
        id: entry.id,
        price: Number(entry.price),
        date: new Date(entry.recordedAt)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [priceHistory]);

  const prices = parsedHistory.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices, Number(currentPrice)) : Number(currentPrice);
  const maxPrice = prices.length ? Math.max(...prices, Number(currentPrice)) : Number(currentPrice);
  const priceRange = maxPrice - minPrice || 1;

  // Chart SVG coordinates calculation
  const width = 600;
  const height = 180;
  const padding = 24;

  const points = React.useMemo(() => {
    if (!parsedHistory.length) return '';
    return parsedHistory
      .map((item, index) => {
        const x = padding + (index / Math.max(1, parsedHistory.length - 1)) * (width - padding * 2);
        const y = height - padding - ((item.price - minPrice) / priceRange) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [parsedHistory, minPrice, priceRange]);

  const areaPath = React.useMemo(() => {
    if (!points) return '';
    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    return `M ${firstX},${bottomY} L ${points} L ${lastX},${bottomY} Z`;
  }, [points]);

  const isLowest = Number(currentPrice) <= minPrice;

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Price History & Analytics</h3>
            {isLowest ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                <TrendingDown className="h-3.5 w-3.5" />
                All-Time Low Price
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tracked price fluctuations over the last recorded billing cycles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lowest</p>
            <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{formatCurrency(minPrice)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Highest</p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(maxPrice)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(Number(currentPrice))}</p>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      {parsedHistory.length > 1 ? (
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-background to-secondary/30 p-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Gridlines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" />

            {/* Shaded Area */}
            <path d={areaPath} fill="url(#priceGradient)" />

            {/* Trend Line */}
            <polyline fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

            {/* Interactive Data Dots */}
            {parsedHistory.map((item, index) => {
              const cx = padding + (index / Math.max(1, parsedHistory.length - 1)) * (width - padding * 2);
              const cy = height - padding - ((item.price - minPrice) / priceRange) * (height - padding * 2);
              return (
                <g key={item.id} className="group cursor-pointer">
                  <circle cx={cx} cy={cy} r="5" className="fill-teal-500 stroke-background stroke-2 transition-transform group-hover:scale-150" />
                  <title>{`${item.date.toLocaleDateString()}: ${formatCurrency(item.price)}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      ) : null}

      {/* History Log Table */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          Recorded Price Log
        </p>
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-background/60">
          {parsedHistory.map((entry, index) => {
            const prevEntry = parsedHistory[index - 1];
            const priceDiff = prevEntry ? entry.price - prevEntry.price : 0;

            return (
              <div key={entry.id} className="flex items-center justify-between p-3 text-xs transition-colors hover:bg-secondary/40">
                <span className="font-medium text-muted-foreground">{entry.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center gap-3">
                  {priceDiff !== 0 ? (
                    <span className={`inline-flex items-center gap-0.5 font-bold ${priceDiff < 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {priceDiff < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      {formatCurrency(Math.abs(priceDiff))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Baseline</span>
                  )}
                  <span className="font-mono font-bold text-foreground">{formatCurrency(entry.price)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

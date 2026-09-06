'use client';

import Image from 'next/image';
import { ImageOff, Sparkles } from 'lucide-react';
import { useState } from 'react';

export const ProductImage = ({
  src,
  alt,
  priority = false
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const canRenderImage = src && !failed;

  if (!canRenderImage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#f8fafc,#e0f2fe_45%,#fff7ed)] p-6 text-center dark:bg-[linear-gradient(135deg,#0f172a,#164e63_55%,#431407)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-muted-foreground shadow-sm">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="line-clamp-2 text-sm font-semibold text-foreground">{alt}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Image coming soon
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
};

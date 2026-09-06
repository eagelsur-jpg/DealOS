'use client';

import { Search as SearchIcon } from 'lucide-react';
import type * as React from 'react';
import { Input } from './input.js';
import { cn } from '../lib/cn.js';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const Search = ({ className, onSearch, ...props }: SearchProps) => (
  <div className={cn('relative', className)}>
    <SearchIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <Input
      className="pl-9"
      {...props}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onSearch) {
          onSearch(event.currentTarget.value);
        }

        props.onKeyDown?.(event);
      }}
    />
  </div>
);

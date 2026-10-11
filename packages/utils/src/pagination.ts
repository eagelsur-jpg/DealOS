import type { PaginatedResult } from '@dealos/types';

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  skip: number;
}

export const createPaginationMeta = (input: PaginationInput = {}): PaginationMeta => {
  const maxPageSize = input.maxPageSize ?? 100;
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page!)) : 1;
  const pageSize = Number.isFinite(input.pageSize)
    ? Math.min(Math.max(1, Math.floor(input.pageSize!)), maxPageSize)
    : 20;
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
};

export const paginate = <T>(
  items: T[],
  totalItems: number,
  meta: PaginationMeta,
): PaginatedResult<T> => ({
  items,
  page: meta.page,
  pageSize: meta.pageSize,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / meta.pageSize)),
});

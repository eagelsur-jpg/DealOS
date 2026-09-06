import type { DealFilters, DealSort } from '@dealos/types';
import { createPaginationMeta, paginate } from '@dealos/utils';
import type { DealListMode, DealRepository } from './deal-repository.js';
import { dealCreateSchema, dealUpdateSchema, type DealCreateInput, type DealUpdateInput } from './deal-validator.js';
import { rankDeals } from './deal-ranking.js';

export class DealService {
  constructor(private readonly repository: DealRepository) {}

  async listDeals(input: {
    mode?: DealListMode;
    filters?: DealFilters;
    page?: number;
    pageSize?: number;
    sort?: DealSort;
  }) {
    const meta = createPaginationMeta({ page: input.page, pageSize: input.pageSize, maxPageSize: 100 });
    const raw = await this.repository.list({
      mode: input.mode,
      filters: input.filters,
      page: meta.page,
      pageSize: meta.pageSize,
      sort: input.sort
    });

    const rankedItems = rankDeals(
      raw.items.map((item) => ({
        ...item,
        clickCount: item._count.clicks
      })),
    );

    return paginate(rankedItems, raw.totalItems, meta);
  }

  async getDeal(id: string) {
    return this.repository.getById(id);
  }

  async createDeal(input: DealCreateInput) {
    const parsed = dealCreateSchema.parse(input);
    return this.repository.create({
      ...parsed,
      description: parsed.description ?? null,
      previousPrice: parsed.previousPrice ?? null,
      startsAt: parsed.startsAt ?? null,
      endsAt: parsed.endsAt ?? null,
      source: parsed.source ?? null
    });
  }

  async updateDeal(id: string, input: DealUpdateInput) {
    const parsed = dealUpdateSchema.parse(input);
    return this.repository.update(id, {
      ...parsed,
      description: parsed.description ?? undefined,
      previousPrice: parsed.previousPrice ?? undefined,
      startsAt: parsed.startsAt ?? undefined,
      endsAt: parsed.endsAt ?? undefined,
      source: parsed.source ?? undefined
    });
  }

  async deleteDeal(id: string) {
    return this.repository.remove(id);
  }

  async searchDeals(query: string, page?: number, pageSize?: number) {
    const meta = createPaginationMeta({ page, pageSize, maxPageSize: 100 });
    const raw = await this.repository.search(query, meta.page, meta.pageSize);
    return paginate(raw.items, raw.totalItems, meta);
  }

  async autocomplete(query: string, limit = 8) {
    return this.repository.autocomplete(query, limit);
  }
}

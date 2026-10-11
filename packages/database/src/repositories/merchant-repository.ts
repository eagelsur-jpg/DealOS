import type { PrismaClient } from '@prisma/client';

export class MerchantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(includeInactive = false) {
    return this.prisma.merchant.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  search(query: string) {
    return this.prisma.merchant.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  getById(id: string) {
    return this.prisma.merchant.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    slug: string;
    websiteUrl: string;
    affiliateNetwork: 'AMAZON' | 'IMPACT' | 'CJ' | 'AWIN' | 'PARTNERIZE' | 'SHAREASALE' | 'CUSTOM';
    isActive?: boolean;
  }) {
    return this.prisma.merchant.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      websiteUrl: string;
      affiliateNetwork:
        'AMAZON' | 'IMPACT' | 'CJ' | 'AWIN' | 'PARTNERIZE' | 'SHAREASALE' | 'CUSTOM';
      isActive: boolean;
    }>,
  ) {
    return this.prisma.merchant.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.merchant.delete({ where: { id } });
  }
}

import type { PrismaClient } from '@prisma/client';

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  search(query: string) {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  getById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  create(data: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    return this.prisma.product.create({
      data: {
        ...data,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        categoryId: data.categoryId ?? null,
      },
    });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      imageUrl: string;
      categoryId: string | null;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}

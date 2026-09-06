import type { PrismaClient } from '@prisma/client';

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  getById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  search(query: string) {
    return this.prisma.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      orderBy: { name: 'asc' }
    });
  }

  create(data: { name: string; slug: string }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<{ name: string; slug: string }>) {
    return this.prisma.category.update({
      where: { id },
      data
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}

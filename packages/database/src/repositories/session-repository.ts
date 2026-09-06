import type { PrismaClient } from '@prisma/client';

export interface CreateSessionData {
  userId?: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateSessionData) {
    return this.prisma.session.create({
      data: {
        userId: data.userId ?? null,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null
      }
    });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: true
      }
    });
  }

  updateLastActive(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: {
        lastActiveAt: new Date()
      }
    });
  }

  delete(id: string) {
    return this.prisma.session.delete({
      where: { id }
    });
  }

  deleteExpired(now: Date = new Date()) {
    return this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: now
        }
      }
    });
  }
}

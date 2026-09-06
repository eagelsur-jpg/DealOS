import type { PrismaClient, UserRole } from '@prisma/client';

export interface CreateUserData {
  email: string;
  name?: string;
  password?: string;
  role?: UserRole;
  image?: string;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  role?: UserRole;
  image?: string;
  emailVerified?: Date | null;
  isActive?: boolean;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true
      }
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true
      }
    });
  }

  createUser(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        password: data.password ?? null,
        role: data.role ?? 'MEMBER',
        image: data.image ?? null
      }
    });
  }

  updateUser(id: string, data: UpdateUserData) {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }
}

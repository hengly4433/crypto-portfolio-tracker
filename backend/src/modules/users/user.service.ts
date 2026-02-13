import { prisma } from '../../config/db';
import { User } from '@prisma/client';

export class UserService {
  async createUser(email: string, passwordHash: string, fullName?: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: bigint): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

import { prisma } from '../../config/db';
import { Exchange } from '@prisma/client';
import { CreateExchangeDto, UpdateExchangeDto } from './exchange.dto';
import { BadRequestError, NotFoundError } from '../../common/errors/http-error';

export class ExchangeService {
  /**
   * Create a new exchange
   */
  async createExchange(data: CreateExchangeDto): Promise<Exchange> {
    // Check if exchange with same code already exists
    const existingExchange = await prisma.exchange.findFirst({
      where: { code: data.code },
    });

    if (existingExchange) {
      throw new BadRequestError(`Exchange with code ${data.code} already exists`);
    }

    return prisma.exchange.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        websiteUrl: data.websiteUrl || null,
      },
    });
  }

  /**
   * Get all exchanges
   */
  async getAllExchanges(): Promise<Exchange[]> {
    return prisma.exchange.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get exchange by ID
   */
  async getExchangeById(id: bigint): Promise<Exchange> {
    const exchange = await prisma.exchange.findUnique({
      where: { id },
    });

    if (!exchange) {
      throw new NotFoundError('Exchange not found');
    }

    return exchange;
  }

  /**
   * Get exchange by code
   */
  async getExchangeByCode(code: string): Promise<Exchange> {
    const exchange = await prisma.exchange.findFirst({
      where: { code },
    });

    if (!exchange) {
      throw new NotFoundError(`Exchange with code ${code} not found`);
    }

    return exchange;
  }

  /**
   * Update an exchange
   */
  async updateExchange(id: bigint, data: UpdateExchangeDto): Promise<Exchange> {
    // Check if exchange exists
    const existingExchange = await prisma.exchange.findUnique({
      where: { id },
    });

    if (!existingExchange) {
      throw new NotFoundError('Exchange not found');
    }

    // If code is being updated, check for conflicts
    if (data.code && data.code !== existingExchange.code) {
      const codeConflict = await prisma.exchange.findFirst({
        where: {
          code: data.code,
          id: { not: id },
        },
      });

      if (codeConflict) {
        throw new BadRequestError(`Exchange with code ${data.code} already exists`);
      }
    }

    return prisma.exchange.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        websiteUrl: data.websiteUrl === '' ? null : data.websiteUrl,
      },
    });
  }

  /**
   * Delete an exchange
   */
  async deleteExchange(id: bigint): Promise<void> {
    // Check if exchange exists
    const exchange = await prisma.exchange.findUnique({
      where: { id },
      include: {
        userAccounts: true,
        apiKeys: true,
      },
    });

    if (!exchange) {
      throw new NotFoundError('Exchange not found');
    }

    // Check if exchange has associated user accounts
    if (exchange.userAccounts.length > 0) {
      throw new BadRequestError(
        `Cannot delete exchange with associated user accounts. Remove accounts first.`
      );
    }

    // Check if exchange has associated API keys
    if (exchange.apiKeys.length > 0) {
      throw new BadRequestError(
        `Cannot delete exchange with associated API keys. Remove API keys first.`
      );
    }

    await prisma.exchange.delete({
      where: { id },
    });
  }

  /**
   * Get exchanges by type (CEX, DEX, WALLET, BROKER)
   */
  async getExchangesByType(type: string): Promise<Exchange[]> {
    return prisma.exchange.findMany({
      where: { type: type as any },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get user accounts for an exchange
   */
  async getExchangeUserAccounts(exchangeId: bigint, userId?: bigint) {
    const whereClause: any = {
      exchangeId,
    };

    if (userId) {
      whereClause.userId = userId;
    }

    return prisma.userAccount.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get API keys for an exchange
   */
  async getExchangeApiKeys(exchangeId: bigint, userId?: bigint) {
    const whereClause: any = {
      exchangeId,
    };

    if (userId) {
      whereClause.userId = userId;
    }

    return prisma.userApiKey.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search exchanges by name or code
   */
  async searchExchanges(query: string): Promise<Exchange[]> {
    return prisma.exchange.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  /**
   * Get exchange statistics
   */
  async getExchangeStats() {
    const totalExchanges = await prisma.exchange.count();
    const exchangesByType = await prisma.exchange.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const userAccountsByExchange = await prisma.userAccount.groupBy({
      by: ['exchangeId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalExchanges,
      exchangesByType: exchangesByType.map(item => ({
        type: item.type,
        count: item._count.id,
      })),
      topExchangesByAccounts: await Promise.all(
        userAccountsByExchange.map(async (item) => {
          const exchange = await prisma.exchange.findUnique({
            where: { id: item.exchangeId },
            select: { id: true, name: true, code: true },
          });
          return {
            exchange,
            accountCount: item._count.id,
          };
        })
      ),
    };
  }
}
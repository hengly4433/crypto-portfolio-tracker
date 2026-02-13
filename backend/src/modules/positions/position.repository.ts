import { prisma } from '../../config/db';
import { Position, Prisma } from '@prisma/client';

export class PositionRepository {
  /**
   * Find position by portfolio, asset, and optionally user account
   */
  async findPosition(
    portfolioId: bigint,
    assetId: bigint,
    userAccountId?: bigint
  ): Promise<Position | null> {
    return prisma.position.findFirst({
      where: {
        portfolioId,
        assetId,
        userAccountId: userAccountId || null,
      },
    });
  }

  /**
   * Find position by ID
   */
  async findById(id: bigint): Promise<Position | null> {
    return prisma.position.findUnique({
      where: { id },
    });
  }

  /**
   * Find all positions for a portfolio
   */
  async findByPortfolio(portfolioId: bigint): Promise<Position[]> {
    return prisma.position.findMany({
      where: { portfolioId },
      include: {
        asset: true,
        userAccount: true,
      },
    });
  }

  /**
   * Find positions for a portfolio and user account
   */
  async findByPortfolioAndAccount(
    portfolioId: bigint,
    userAccountId: bigint
  ): Promise<Position[]> {
    return prisma.position.findMany({
      where: {
        portfolioId,
        userAccountId,
      },
      include: {
        asset: true,
      },
    });
  }

  /**
   * Create a new position
   */
  async create(data: {
    portfolioId: bigint;
    assetId: bigint;
    userAccountId?: bigint;
    quantity: Prisma.Decimal;
    costBasis: Prisma.Decimal;
    avgPrice: Prisma.Decimal;
  }): Promise<Position> {
    return prisma.position.create({
      data: {
        ...data,
        realizedPnl: new Prisma.Decimal(0),
        unrealizedPnl: new Prisma.Decimal(0),
        lastUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Update an existing position
   */
  async update(
    id: bigint,
    data: {
      quantity?: Prisma.Decimal;
      costBasis?: Prisma.Decimal;
      avgPrice?: Prisma.Decimal;
      realizedPnl?: Prisma.Decimal;
      unrealizedPnl?: Prisma.Decimal;
    }
  ): Promise<Position> {
    return prisma.position.update({
      where: { id },
      data: {
        ...data,
        lastUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Update position with atomic operations
   */
  async updateWithAtomic(
    portfolioId: bigint,
    assetId: bigint,
    userAccountId: bigint | null,
    updates: {
      quantityDelta: Prisma.Decimal;
      costBasisDelta: Prisma.Decimal;
    }
  ): Promise<Position> {
    // Use Prisma's update with where clause
    // This should be wrapped in a transaction at a higher level
    const position = await this.findPosition(portfolioId, assetId, userAccountId || undefined);
    
    if (!position) {
      throw new Error('Position not found');
    }

    const newQuantity = position.quantity.plus(updates.quantityDelta);
    const newCostBasis = position.costBasis.plus(updates.costBasisDelta);
    const newAvgPrice = newQuantity.isZero() 
      ? new Prisma.Decimal(0) 
      : newCostBasis.div(newQuantity);

    return prisma.position.update({
      where: { id: position.id },
      data: {
        quantity: newQuantity,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
        lastUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a position
   */
  async delete(id: bigint): Promise<void> {
    await prisma.position.delete({
      where: { id },
    });
  }

  /**
   * Get portfolio positions with asset details
   */
  async getPortfolioPositionsWithDetails(portfolioId: bigint): Promise<Position[]> {
    return prisma.position.findMany({
      where: { portfolioId },
      include: {
        asset: true,
        userAccount: true,
      },
      orderBy: {
        asset: {
          symbol: 'asc',
        },
      },
    });
  }

  /**
   * Calculate portfolio totals
   */
  async calculatePortfolioTotals(portfolioId: bigint): Promise<{
    totalQuantity: Prisma.Decimal;
    totalCostBasis: Prisma.Decimal;
    totalRealizedPnl: Prisma.Decimal;
    totalUnrealizedPnl: Prisma.Decimal;
  }> {
    const positions = await this.findByPortfolio(portfolioId);
    
    const totals = positions.reduce(
      (acc, position) => ({
        totalQuantity: acc.totalQuantity.plus(position.quantity),
        totalCostBasis: acc.totalCostBasis.plus(position.costBasis),
        totalRealizedPnl: acc.totalRealizedPnl.plus(position.realizedPnl),
        totalUnrealizedPnl: acc.totalUnrealizedPnl.plus(position.unrealizedPnl),
      }),
      {
        totalQuantity: new Prisma.Decimal(0),
        totalCostBasis: new Prisma.Decimal(0),
        totalRealizedPnl: new Prisma.Decimal(0),
        totalUnrealizedPnl: new Prisma.Decimal(0),
      }
    );

    return totals;
  }
}
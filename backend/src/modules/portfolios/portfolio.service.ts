import { prisma } from '../../config/db';
import { Portfolio, Position, Asset, PortfolioSnapshot } from '@prisma/client';
import { PriceService } from '../price/price.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../common/errors/http-error';
import { Prisma } from '@prisma/client';

export interface PortfolioSummary {
  id: bigint;
  name: string;
  baseCurrency: string;
  totalValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: PositionSummary[];
  allocation: AllocationSlice[];
  performance: PerformancePoint[];
}

export interface PositionSummary {
  assetId: bigint;
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  pnlPercent: number;
  weight: number;
}

export interface AllocationSlice {
  assetType: string;
  value: number;
  percentage: number;
}

export interface PerformancePoint {
  date: Date;
  value: number;
  pnl: number;
}

export class PortfolioService {
  private priceService: PriceService;
  private auditService: AuditService;

  constructor() {
    this.priceService = new PriceService();
    this.auditService = new AuditService();
  }

  async createPortfolio(userId: bigint, name: string, baseCurrency: string = 'USD') {
    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name,
        baseCurrency,
        isDefault: false, // Logic to handle default?
      },
    });

    // Log portfolio creation
    await this.auditService.logCreate(
      userId,
      'PORTFOLIO',
      portfolio.id,
      { name, baseCurrency, isDefault: false }
    );

    return portfolio;
  }

  async updatePortfolio(userId: bigint, portfolioId: bigint, data: { name?: string; baseCurrency?: string; description?: string }) {
    // First verify portfolio exists and user owns it
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    const oldValue = { ...portfolio };
    
    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data,
    });

    // Log portfolio update
    await this.auditService.logUpdate(
      userId,
      'PORTFOLIO',
      portfolioId,
      oldValue,
      data
    );

    return updatedPortfolio;
  }

  async deletePortfolio(userId: bigint, portfolioId: bigint): Promise<void> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    // Cascade delete all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete notifications related to alerts on this portfolio
      await tx.notification.deleteMany({
        where: { alert: { portfolioId } },
      });
      // Delete alerts
      await tx.alert.deleteMany({
        where: { portfolioId },
      });
      // Delete snapshots
      await tx.portfolioSnapshot.deleteMany({
        where: { portfolioId },
      });
      // Delete transactions
      await tx.transaction.deleteMany({
        where: { portfolioId },
      });
      // Delete positions
      await tx.position.deleteMany({
        where: { portfolioId },
      });
      // Delete portfolio accounts
      await tx.portfolioAccount.deleteMany({
        where: { portfolioId },
      });
      // Delete portfolio
      await tx.portfolio.delete({
        where: { id: portfolioId },
      });
    });

    // Log portfolio deletion
    await this.auditService.logDelete(
      userId,
      'PORTFOLIO',
      portfolioId,
      { name: portfolio.name }
    );
  }

  async getUserPortfolios(userId: bigint): Promise<Portfolio[]> {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getPortfolioById(id: bigint, userId: bigint): Promise<Portfolio | null> {
    return prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        positions: {
          include: { asset: true },
        },
      },
    });
  }

  /**
   * Get comprehensive portfolio summary with analytics
   */
  async getPortfolioSummary(portfolioId: bigint, userId: bigint): Promise<PortfolioSummary> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        positions: {
          include: {
            asset: true,
          },
        },
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 30, // Last 30 days for performance chart
        },
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate current values for all positions
    const positionSummaries: PositionSummary[] = [];
    let totalValue = 0;
    let totalCostBasis = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;

    for (const position of portfolio.positions) {
      try {
        const currentPrice = await this.priceService.getPriceInBase(
          position.assetId,
          portfolio.baseCurrency
        );
        
        const marketValue = position.quantity.mul(currentPrice);
        const costBasis = position.costBasis;
        const unrealizedPnl = marketValue.minus(costBasis);
        const pnlPercent = costBasis.isZero() ? 0 : unrealizedPnl.div(costBasis).mul(100);
        
        const positionSummary: PositionSummary = {
          assetId: position.assetId,
          symbol: position.asset.symbol,
          name: position.asset.name,
          assetType: position.asset.assetType,
          quantity: position.quantity.toNumber(),
          avgPrice: position.avgPrice.toNumber(),
          currentPrice: currentPrice.toNumber(),
          marketValue: marketValue.toNumber(),
          costBasis: costBasis.toNumber(),
          unrealizedPnl: unrealizedPnl.toNumber(),
          realizedPnl: Number(position.realizedPnl),
          pnlPercent: typeof pnlPercent === 'number' ? pnlPercent : pnlPercent.toNumber(),
          weight: 0, // Will calculate after total value
        };

        positionSummaries.push(positionSummary);
        totalValue += marketValue.toNumber();
        totalCostBasis += costBasis.toNumber();
        totalUnrealizedPnl += unrealizedPnl.toNumber();
        totalRealizedPnl += Number(position.realizedPnl);
      } catch (error) {
        console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
      }
    }

    // Calculate weights
    positionSummaries.forEach(pos => {
      pos.weight = totalValue > 0 ? (pos.marketValue / totalValue) * 100 : 0;
    });

    // Calculate allocation by asset type
    const allocation = this.calculateAllocation(positionSummaries);

    // Calculate daily change from snapshots
    const dailyChange = this.calculateDailyChange(portfolio.snapshots, totalValue);

    // Prepare performance points
    const performance = this.preparePerformancePoints(portfolio.snapshots);

    return {
      id: portfolio.id,
      name: portfolio.name,
      baseCurrency: portfolio.baseCurrency,
      totalValue,
      totalUnrealizedPnl,
      totalRealizedPnl,
      dailyChange: dailyChange.change,
      dailyChangePercent: dailyChange.percent,
      positions: positionSummaries,
      allocation,
      performance,
    };
  }

  /**
   * Calculate allocation by asset type
   */
  private calculateAllocation(positions: PositionSummary[]): AllocationSlice[] {
    const allocationMap = new Map<string, { value: number; count: number }>();
    
    for (const position of positions) {
      const assetType = position.assetType;
      const current = allocationMap.get(assetType) || { value: 0, count: 0 };
      current.value += position.marketValue;
      current.count += 1;
      allocationMap.set(assetType, current);
    }

    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    return Array.from(allocationMap.entries()).map(([assetType, data]) => ({
      assetType,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    }));
  }

  /**
   * Calculate daily change from snapshots
   */
  private calculateDailyChange(snapshots: PortfolioSnapshot[], currentValue: number): { change: number; percent: number } {
    if (snapshots.length < 2) {
      return { change: 0, percent: 0 };
    }

    // Get yesterday's snapshot (most recent before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterdaySnapshot = snapshots
      .filter(s => new Date(s.createdAt) < today)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!yesterdaySnapshot) {
      return { change: 0, percent: 0 };
    }

    const yesterdayValue = Number(yesterdaySnapshot.totalValue);
    const change = currentValue - yesterdayValue;
    const percent = yesterdayValue === 0 ? 0 : (change / yesterdayValue) * 100;

    return { change, percent };
  }

  /**
   * Prepare performance points for chart
   */
  private preparePerformancePoints(snapshots: PortfolioSnapshot[]): PerformancePoint[] {
    return snapshots.map(snapshot => ({
      date: snapshot.createdAt,
      value: Number(snapshot.totalValue),
      pnl: Number(snapshot.totalUnrealizedPnl) + Number(snapshot.totalRealizedPnl),
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get portfolio performance over time range
   */
  async getPortfolioPerformance(portfolioId: bigint, userId: bigint, days: number = 30): Promise<PerformancePoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        portfolioId,
        portfolio: { userId },
        createdAt: { gte: cutoffDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    return snapshots.map(snapshot => ({
      date: snapshot.createdAt,
      value: Number(snapshot.totalValue),
      pnl: Number(snapshot.totalUnrealizedPnl) + Number(snapshot.totalRealizedPnl),
    }));
  }

  /**
   * Get top gainers/losers
   */
  async getTopPerformers(portfolioId: bigint, userId: bigint, limit: number = 5): Promise<PositionSummary[]> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        positions: {
          include: { asset: true },
        },
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const positionSummaries: PositionSummary[] = [];

    for (const position of portfolio.positions) {
      try {
        const currentPrice = await this.priceService.getPriceInBase(
          position.assetId,
          portfolio.baseCurrency
        );
        
        const marketValue = position.quantity.mul(currentPrice);
        const costBasis = position.costBasis;
        const unrealizedPnl = marketValue.minus(costBasis);
        const pnlPercent = costBasis.isZero() ? 0 : unrealizedPnl.div(costBasis).mul(100);
        
        const positionSummary: PositionSummary = {
          assetId: position.assetId,
          symbol: position.asset.symbol,
          name: position.asset.name,
          assetType: position.asset.assetType,
          quantity: position.quantity.toNumber(),
          avgPrice: position.avgPrice.toNumber(),
          currentPrice: currentPrice.toNumber(),
          marketValue: marketValue.toNumber(),
          costBasis: costBasis.toNumber(),
          unrealizedPnl: unrealizedPnl.toNumber(),
          realizedPnl: Number(position.realizedPnl),
          pnlPercent: typeof pnlPercent === 'number' ? pnlPercent : pnlPercent.toNumber(),
          weight: 0,
        };

        positionSummaries.push(positionSummary);
      } catch (error) {
        console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
      }
    }

    // Sort by P&L percent and return top/bottom
    return positionSummaries
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, limit);
  }

  /**
   * Update portfolio snapshot (used by scheduled job)
   */
  async updatePortfolioSnapshot(portfolioId: bigint): Promise<void> {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: {
          include: { asset: true },
        },
      },
    });

    if (!portfolio) {
      return;
    }

    let totalValue = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;

    for (const position of portfolio.positions) {
      try {
        const currentPrice = await this.priceService.getPriceInBase(
          position.assetId,
          portfolio.baseCurrency
        );
        
        const marketValue = position.quantity.mul(currentPrice);
        const unrealizedPnl = marketValue.minus(position.costBasis);
        
        totalValue += marketValue.toNumber();
        totalUnrealizedPnl += unrealizedPnl.toNumber();
        totalRealizedPnl += Number(position.realizedPnl);
      } catch (error) {
        console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
      }
    }

    await prisma.portfolioSnapshot.create({
      data: {
        portfolioId,
        totalValue,
        totalUnrealizedPnl,
        totalRealizedPnl,
      },
    });
  }
}

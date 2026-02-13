import { PositionRepository } from './position.repository';
import { PriceService } from '../price/price.service';
import { Prisma } from '@prisma/client';

export interface PositionSummary {
  id: bigint;
  portfolioId: bigint;
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

export class PositionService {
  private positionRepository: PositionRepository;
  private priceService: PriceService;

  constructor() {
    this.positionRepository = new PositionRepository();
    this.priceService = new PriceService();
  }

  /**
   * Get position by portfolio, asset, and optionally user account
   */
  async getPosition(
    portfolioId: bigint,
    assetId: bigint,
    userAccountId?: bigint
  ) {
    return this.positionRepository.findPosition(portfolioId, assetId, userAccountId);
  }

  /**
   * Get all positions for a portfolio with details
   */
  async getPortfolioPositions(portfolioId: bigint) {
    return this.positionRepository.getPortfolioPositionsWithDetails(portfolioId);
  }

  /**
   * Update position with transaction (buy/sell)
   */
  async updatePosition(
    portfolioId: bigint,
    assetId: bigint,
    quantityDelta: Prisma.Decimal,
    costBasisDelta: Prisma.Decimal,
    userAccountId?: bigint
  ) {
    const position = await this.positionRepository.findPosition(
      portfolioId,
      assetId,
      userAccountId
    );

    if (position) {
      // Update existing position
      const newQuantity = position.quantity.plus(quantityDelta);
      const newCostBasis = position.costBasis.plus(costBasisDelta);
      const newAvgPrice = newQuantity.isZero() 
        ? new Prisma.Decimal(0) 
        : newCostBasis.div(newQuantity);

      return this.positionRepository.update(position.id, {
        quantity: newQuantity,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
      });
    } else {
      // Create new position
      const initialQuantity = quantityDelta;
      const initialCostBasis = costBasisDelta;
      const initialAvgPrice = initialQuantity.isZero()
        ? new Prisma.Decimal(0)
        : initialCostBasis.div(initialQuantity);

      return this.positionRepository.create({
        portfolioId,
        assetId,
        userAccountId,
        quantity: initialQuantity,
        costBasis: initialCostBasis,
        avgPrice: initialAvgPrice,
      });
    }
  }

  /**
   * Calculate position summary with current prices
   */
  async calculatePositionSummary(
    position: any,
    baseCurrency: string
  ): Promise<PositionSummary> {
    try {
      const currentPrice = await this.priceService.getPriceInBase(
        position.assetId,
        baseCurrency
      );
      
      const marketValue = position.quantity.mul(currentPrice);
      const costBasis = position.costBasis;
      const unrealizedPnl = marketValue.minus(costBasis);
      const pnlPercent = costBasis.isZero() 
        ? new Prisma.Decimal(0) 
        : unrealizedPnl.div(costBasis).mul(100);
      
      return {
        id: position.id,
        portfolioId: position.portfolioId,
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
        weight: 0, // To be calculated by caller
      };
    } catch (error) {
      console.error(`Failed to calculate position summary for asset ${position.assetId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate portfolio positions summaries
   */
  async calculatePortfolioPositionSummaries(
    portfolioId: bigint,
    baseCurrency: string
  ): Promise<PositionSummary[]> {
    const positions = await this.getPortfolioPositions(portfolioId);
    const summaries: PositionSummary[] = [];

    for (const position of positions) {
      try {
        const summary = await this.calculatePositionSummary(position, baseCurrency);
        summaries.push(summary);
      } catch (error) {
        console.error(`Failed to calculate position ${position.id}:`, error);
      }
    }

    return summaries;
  }

  /**
   * Update unrealized P&L for a position
   */
  async updateUnrealizedPnl(
    positionId: bigint,
    currentPrice: Prisma.Decimal
  ) {
    const position = await this.positionRepository.findById(positionId);
    if (!position) {
      throw new Error(`Position ${positionId} not found`);
    }

    const marketValue = position.quantity.mul(currentPrice);
    const unrealizedPnl = marketValue.minus(position.costBasis);

    return this.positionRepository.update(positionId, {
      unrealizedPnl,
    });
  }

  /**
   * Update realized P&L for a position (when selling)
   */
  async updateRealizedPnl(
    positionId: bigint,
    realizedPnlDelta: Prisma.Decimal
  ) {
    const position = await this.positionRepository.findById(positionId);
    if (!position) {
      throw new Error(`Position ${positionId} not found`);
    }

    const newRealizedPnl = position.realizedPnl.plus(realizedPnlDelta);

    return this.positionRepository.update(positionId, {
      realizedPnl: newRealizedPnl,
    });
  }

  /**
   * Delete a position
   */
  async deletePosition(positionId: bigint) {
    return this.positionRepository.delete(positionId);
  }

  /**
   * Get portfolio totals
   */
  async getPortfolioTotals(portfolioId: bigint) {
    return this.positionRepository.calculatePortfolioTotals(portfolioId);
  }

  /**
   * Recalculate all positions for a portfolio
   */
  async recalculatePortfolioPositions(
    portfolioId: bigint,
    baseCurrency: string
  ) {
    const positions = await this.getPortfolioPositions(portfolioId);
    
    for (const position of positions) {
      try {
        const currentPrice = await this.priceService.getPriceInBase(
          position.assetId,
          baseCurrency
        );
        await this.updateUnrealizedPnl(position.id, currentPrice);
      } catch (error) {
        console.error(`Failed to recalculate position ${position.id}:`, error);
      }
    }
  }
}

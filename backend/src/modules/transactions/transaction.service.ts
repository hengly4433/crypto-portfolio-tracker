import { prisma } from '../../config/db';
import { Transaction, TransactionSide } from '@prisma/client';
import { PositionService } from '../positions/position.service';
import { PriceService } from '../price/price.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';
import { BadRequestError } from '../../common/errors/http-error';

export class TransactionService {
  private positionService: PositionService;
  private priceService: PriceService;
  private auditService: AuditService;

  constructor() {
    this.positionService = new PositionService();
    this.priceService = new PriceService();
    this.auditService = new AuditService();
  }

  /**
   * Create a transaction with proper P/L calculations and position updates
   * Supports all transaction sides: BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, INCOME, FEE
   */
  async createTransaction(data: {
    portfolioId: bigint;
    assetId: bigint;
    side: TransactionSide;
    quantity: number | Prisma.Decimal;
    price?: number | Prisma.Decimal; // Optional for non-trading transactions
    transactionCurrency: string;
    date: Date;
    userAccountId?: bigint;
    feeAmount?: number | Prisma.Decimal;
    feeCurrency?: string;
    note?: string;
  }): Promise<Transaction> {
    const {
      portfolioId,
      assetId,
      side,
      quantity,
      price,
      transactionCurrency,
      date,
      userAccountId = 1n, // Default to manual account
      feeAmount = 0,
      feeCurrency,
      note,
    } = data;
    
    const qtyDecimal = new Prisma.Decimal(quantity);
    const priceDecimal = price ? new Prisma.Decimal(price) : new Prisma.Decimal(0);
    const grossAmount = qtyDecimal.mul(priceDecimal);
    const feeAmountDecimal = new Prisma.Decimal(feeAmount);
    
    // Validate based on transaction type
    this.validateTransaction(side, qtyDecimal, priceDecimal);
    
    // Start database transaction
    return prisma.$transaction(async (tx) => {
      // Get portfolio to determine base currency
      const portfolio = await tx.portfolio.findUnique({
        where: { id: portfolioId },
      });

      if (!portfolio) {
        throw new BadRequestError('Portfolio not found');
      }

      // Convert amounts to portfolio base currency if needed
      let grossAmountBase = grossAmount;
      let feeAmountBase = feeAmountDecimal;

      if (transactionCurrency !== portfolio.baseCurrency) {
        const fxRate = await this.priceService.getFxRate(transactionCurrency, portfolio.baseCurrency);
        grossAmountBase = grossAmount.mul(fxRate);
        feeAmountBase = feeAmountDecimal.mul(fxRate);
      }

      // 1. Create Transaction Record
      const transaction = await tx.transaction.create({
        data: {
          portfolioId,
          assetId,
          userAccountId,
          side,
          quantity: qtyDecimal,
          price: priceDecimal,
          transactionCurrency,
          grossAmount,
          feeAmount: feeAmountDecimal,
          feeCurrency,
          tradeTime: date,
          note,
        },
      });

      // 2. Update Position based on transaction type
      await this.updatePositionForTransaction(tx, {
        portfolioId,
        assetId,
        userAccountId,
        side,
        quantity: qtyDecimal,
        grossAmountBase,
        feeAmountBase,
        priceDecimal,
        portfolioBaseCurrency: portfolio.baseCurrency,
      });

      return transaction;
    });
  }

  /**
   * Validate transaction based on type
   */
  private validateTransaction(
    side: TransactionSide,
    quantity: Prisma.Decimal,
    price: Prisma.Decimal
  ): void {
    // Quantity must be positive for all transaction types
    if (quantity.lte(0)) {
      throw new BadRequestError('Quantity must be positive');
    }

    // Price must be positive for trading transactions
    const isTradingTransaction = ['BUY', 'SELL'].includes(side);
    if (isTradingTransaction && price.lte(0)) {
      throw new BadRequestError('Price must be positive for trading transactions');
    }

    // Non-trading transactions may not need price
    const isNonTradingTransaction = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'INCOME', 'FEE'].includes(side);
    if (isNonTradingTransaction && price.gt(0)) {
      // Price may be optional or zero for non-trading transactions
    }
  }

  /**
   * Update position based on transaction type
   */
  private async updatePositionForTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      userAccountId: bigint;
      side: TransactionSide;
      quantity: Prisma.Decimal;
      grossAmountBase: Prisma.Decimal;
      feeAmountBase: Prisma.Decimal;
      priceDecimal: Prisma.Decimal;
      portfolioBaseCurrency: string;
    }
  ): Promise<void> {
    const {
      portfolioId,
      assetId,
      userAccountId,
      side,
      quantity,
      grossAmountBase,
      feeAmountBase,
      priceDecimal,
      portfolioBaseCurrency,
    } = data;

    // Find existing position
    const existingPosition = await tx.position.findFirst({
      where: { 
        portfolioId, 
        assetId,
        userAccountId: userAccountId || null,
      },
    });

    switch (side) {
      case 'BUY':
        await this.handleBuyTransaction(tx, {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          grossAmountBase,
          feeAmountBase,
          priceDecimal,
          existingPosition,
        });
        break;

      case 'SELL':
        await this.handleSellTransaction(tx, {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          grossAmountBase,
          feeAmountBase,
          priceDecimal,
          existingPosition,
        });
        break;

      case 'DEPOSIT':
      case 'TRANSFER_IN':
      case 'INCOME':
        // Add to position without affecting cost basis (treat as zero-cost acquisition)
        await this.handleInflowTransaction(tx, {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          existingPosition,
        });
        break;

      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
      case 'FEE':
        // Remove from position (reduce quantity proportionally)
        await this.handleOutflowTransaction(tx, {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          existingPosition,
        });
        break;

      default:
        throw new BadRequestError(`Unsupported transaction side: ${side}`);
    }

    // Update unrealized P/L for the position
    if (existingPosition) {
      await this.updateUnrealizedPnl(tx, {
        positionId: existingPosition.id,
        assetId,
        portfolioBaseCurrency,
      });
    }
  }

  /**
   * Handle BUY transaction - adds to position and increases cost basis
   */
  private async handleBuyTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      userAccountId: bigint;
      quantity: Prisma.Decimal;
      grossAmountBase: Prisma.Decimal;
      feeAmountBase: Prisma.Decimal;
      priceDecimal: Prisma.Decimal;
      existingPosition: any;
    }
  ): Promise<void> {
    const {
      portfolioId,
      assetId,
      userAccountId,
      quantity,
      grossAmountBase,
      feeAmountBase,
      priceDecimal,
      existingPosition,
    } = data;

    const totalCost = grossAmountBase.plus(feeAmountBase);

    if (existingPosition) {
      const newQuantity = existingPosition.quantity.plus(quantity);
      const newCostBasis = existingPosition.costBasis.plus(totalCost);
      const newAvgPrice = newQuantity.isZero() ? new Prisma.Decimal(0) : newCostBasis.div(newQuantity);

      await tx.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: newQuantity,
          costBasis: newCostBasis,
          avgPrice: newAvgPrice,
        },
      });
    } else {
      await tx.position.create({
        data: {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          costBasis: totalCost,
          avgPrice: priceDecimal,
          realizedPnl: 0,
          unrealizedPnl: 0,
        },
      });
    }
  }

  /**
   * Handle SELL transaction - reduces position and calculates realized P/L
   */
  private async handleSellTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      userAccountId: bigint;
      quantity: Prisma.Decimal;
      grossAmountBase: Prisma.Decimal;
      feeAmountBase: Prisma.Decimal;
      priceDecimal: Prisma.Decimal;
      existingPosition: any;
    }
  ): Promise<void> {
    const {
      portfolioId,
      assetId,
      userAccountId,
      quantity,
      grossAmountBase,
      feeAmountBase,
      existingPosition,
    } = data;

    if (!existingPosition) {
      throw new BadRequestError('Cannot sell asset without existing position');
    }

    if (existingPosition.quantity.lt(quantity)) {
      throw new BadRequestError('Insufficient quantity to sell');
    }

    // Calculate cost of goods sold (proportional to cost basis)
    const costOfSold = existingPosition.costBasis.mul(quantity).div(existingPosition.quantity);
    
    // Calculate realized P/L (gross proceeds - cost of sold - fees)
    const realizedPnl = grossAmountBase.minus(costOfSold).minus(feeAmountBase);
    
    // Update position
    const newQuantity = existingPosition.quantity.minus(quantity);
    const newCostBasis = existingPosition.costBasis.minus(costOfSold);
    const newAvgPrice = newQuantity.isZero() ? new Prisma.Decimal(0) : newCostBasis.div(newQuantity);
    const newRealizedPnl = existingPosition.realizedPnl.plus(realizedPnl);

    await tx.position.update({
      where: { id: existingPosition.id },
      data: {
        quantity: newQuantity,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
        realizedPnl: newRealizedPnl,
      },
    });
  }

  /**
   * Handle inflow transactions (DEPOSIT, TRANSFER_IN, INCOME) - add quantity at zero cost
   */
  private async handleInflowTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      userAccountId: bigint;
      quantity: Prisma.Decimal;
      existingPosition: any;
    }
  ): Promise<void> {
    const {
      portfolioId,
      assetId,
      userAccountId,
      quantity,
      existingPosition,
    } = data;

    if (existingPosition) {
      const newQuantity = existingPosition.quantity.plus(quantity);
      // Cost basis remains unchanged (zero-cost addition)
      const newAvgPrice = newQuantity.isZero() ? new Prisma.Decimal(0) : existingPosition.costBasis.div(newQuantity);

      await tx.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: newQuantity,
          avgPrice: newAvgPrice,
        },
      });
    } else {
      // Create new position with zero cost basis
      await tx.position.create({
        data: {
          portfolioId,
          assetId,
          userAccountId,
          quantity,
          costBasis: 0,
          avgPrice: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
        },
      });
    }
  }

  /**
   * Handle outflow transactions (WITHDRAWAL, TRANSFER_OUT, FEE) - remove quantity proportionally
   */
  private async handleOutflowTransaction(
    tx: Prisma.TransactionClient,
    data: {
      portfolioId: bigint;
      assetId: bigint;
      userAccountId: bigint;
      quantity: Prisma.Decimal;
      existingPosition: any;
    }
  ): Promise<void> {
    const {
      portfolioId,
      assetId,
      userAccountId,
      quantity,
      existingPosition,
    } = data;

    if (!existingPosition) {
      throw new BadRequestError('Cannot withdraw asset without existing position');
    }

    if (existingPosition.quantity.lt(quantity)) {
      throw new BadRequestError('Insufficient quantity to withdraw');
    }

    // Calculate cost basis reduction (proportional)
    const costReduction = existingPosition.costBasis.mul(quantity).div(existingPosition.quantity);
    
    // Update position
    const newQuantity = existingPosition.quantity.minus(quantity);
    const newCostBasis = existingPosition.costBasis.minus(costReduction);
    const newAvgPrice = newQuantity.isZero() ? new Prisma.Decimal(0) : newCostBasis.div(newQuantity);

    await tx.position.update({
      where: { id: existingPosition.id },
      data: {
        quantity: newQuantity,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
      },
    });
  }

  /**
   * Update unrealized P/L for a position based on current market price
   */
  private async updateUnrealizedPnl(
    tx: Prisma.TransactionClient,
    data: {
      positionId: bigint;
      assetId: bigint;
      portfolioBaseCurrency: string;
    }
  ): Promise<void> {
    const { positionId, assetId, portfolioBaseCurrency } = data;

    const position = await tx.position.findUnique({
      where: { id: positionId },
    });

    if (!position || position.quantity.isZero()) {
      return;
    }

    try {
      const currentPrice = await this.priceService.getPriceInBase(assetId, portfolioBaseCurrency);
      const marketValue = position.quantity.mul(currentPrice);
      const costBasis = position.costBasis;
      const unrealizedPnl = marketValue.minus(costBasis);

      await tx.position.update({
        where: { id: positionId },
        data: {
          unrealizedPnl,
          lastUpdatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to update unrealized P/L for position ${positionId}:`, error);
    }
  }

  /**
   * Get all transactions for a portfolio
   */
  async getTransactions(portfolioId: bigint): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { portfolioId },
      orderBy: { tradeTime: 'desc' },
      include: { 
        asset: true,
        userAccount: {
          include: {
            exchange: true,
          },
        },
      },
    });
  }

  /**
   * Get paginated transactions for a portfolio
   */
  async getTransactionsPaginated(portfolioId: bigint, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { portfolioId },
        orderBy: { tradeTime: 'desc' },
        skip,
        take: limit,
        include: {
          asset: true,
          userAccount: {
            include: { exchange: true },
          },
        },
      }),
      prisma.transaction.count({ where: { portfolioId } }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: bigint): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        asset: true,
        portfolio: true,
        userAccount: {
          include: {
            exchange: true,
          },
        },
      },
    });
  }

  /**
   * Delete transaction (and reverse position changes)
   */
  async deleteTransaction(transactionId: bigint, portfolioId: bigint): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { portfolio: true },
      });

      if (!transaction) {
        throw new BadRequestError('Transaction not found');
      }

      if (transaction.portfolioId !== portfolioId) {
        throw new BadRequestError('Transaction does not belong to this portfolio');
      }

      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });
  }
}

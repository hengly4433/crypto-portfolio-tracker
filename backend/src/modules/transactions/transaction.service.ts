import { prisma } from '../../config/db';
import { Transaction, TransactionSide } from '@prisma/client';
import { PositionService } from '../positions/position.service';
import { PriceService } from '../price/price.service';
import { AuditService } from '../audit/audit.service';
import { AssetService } from '../assets/asset.service';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../common/errors/http-error';

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
    assetId: bigint | string | number; // Allow CoinGecko ID
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
      assetId: idOrCoingeckoId,
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
    
    // Resolve asset (create from CoinGecko if needed)
    const assetService = new AssetService();
    const assetResolved = await assetService.ensureAsset(idOrCoingeckoId);
    const assetId = assetResolved.id;
    
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

      // 1. Get Asset to check symbol for fee deduction
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new BadRequestError('Asset not found');
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
        feeAmount: feeAmountDecimal,
        feeCurrency,
        assetSymbol: asset.symbol,
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
      feeAmount: Prisma.Decimal;
      feeCurrency?: string;
      assetSymbol: string;
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
      feeAmount,
      feeCurrency,
      assetSymbol,
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
          feeAmount,
          feeCurrency,
          assetSymbol,
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
      feeAmount: Prisma.Decimal;
      feeCurrency?: string;
      assetSymbol: string;
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
      feeAmount,
      feeCurrency,
      assetSymbol,
      priceDecimal,
      existingPosition,
    } = data;

    // Check if fee is paid in the asset itself (e.g. bought 1 ETH, fee 0.001 ETH)
    const isFeeInAsset = feeCurrency === assetSymbol;
    
    // If fee is in asset, we deduct it from the quantity we receive.
    // The Cost Basis should NOT increase by the fee value in this case, 
    // because the fee was already part of the gross amount we paid for.
    const netQuantity = isFeeInAsset ? quantity.minus(feeAmount) : quantity;
    const totalCost = isFeeInAsset ? grossAmountBase : grossAmountBase.plus(feeAmountBase);

    if (existingPosition) {
      const newQuantity = existingPosition.quantity.plus(netQuantity);
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
          quantity: netQuantity,
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
   * Revert the effect of a transaction on the position
   */
  private async revertTransactionEffect(
    tx: Prisma.TransactionClient,
    transaction: Transaction,
    portfolioId: bigint
  ): Promise<void> {
    const position = await tx.position.findFirst({
      where: {
        portfolioId,
        assetId: transaction.assetId,
        userAccountId: transaction.userAccountId,
      },
    });

    if (!position) {
      console.warn(`Position not found for transaction ${transaction.id}, skipping revert.`);
      return;
    }

    const qty = transaction.quantity;
    const gross = transaction.grossAmount;
    const fee = transaction.feeAmount;

    // Helper to update position
    const updatePos = async (data: Prisma.PositionUpdateInput) => {
      await tx.position.update({
        where: { id: position.id },
        data,
      });
    };

    switch (transaction.side) {
      case 'BUY': {
        const asset = await tx.asset.findUnique({ where: { id: transaction.assetId } });
        const isFeeInAsset = asset && transaction.feeCurrency === asset.symbol;
        
        const netQtyBuy = isFeeInAsset ? qty.minus(fee) : qty;
        
        const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });
        let grossBase = gross;
        let feeBase = fee;
        
        if (portfolio && transaction.transactionCurrency !== portfolio.baseCurrency) {
             const fxRate = await this.priceService.getFxRate(
                transaction.transactionCurrency, 
                portfolio.baseCurrency
             );
             grossBase = gross.mul(fxRate);
             feeBase = fee.mul(fxRate);
        }

        const totalCostBuy = isFeeInAsset ? grossBase : grossBase.plus(feeBase);
        
        const newQtyBuy = position.quantity.minus(netQtyBuy);
        const newCostBuy = position.costBasis.minus(totalCostBuy);
        const newAvgBuy = newQtyBuy.isZero() ? new Prisma.Decimal(0) : newCostBuy.div(newQtyBuy);

        await updatePos({
            quantity: newQtyBuy,
            costBasis: newCostBuy,
            avgPrice: newAvgBuy,
        });
        break;
      }

      case 'SELL': {
        const costRestored = position.avgPrice.mul(qty);
        const newQtySell = position.quantity.plus(qty);
        const newCostSell = position.costBasis.plus(costRestored);
        
        const pfolioSell = await tx.portfolio.findUnique({ where: { id: portfolioId } });
        let grossBaseSell = gross;
        let feeBaseSell = fee;
        if (pfolioSell && transaction.transactionCurrency !== pfolioSell.baseCurrency) {
              const fxRate = await this.priceService.getFxRate(
                transaction.transactionCurrency, 
                pfolioSell.baseCurrency
             );
             grossBaseSell = gross.mul(fxRate);
             feeBaseSell = fee.mul(fxRate);
        }
        
        const pnlReversal = grossBaseSell.minus(costRestored).minus(feeBaseSell);
        const newRealized = position.realizedPnl.minus(pnlReversal);

        await updatePos({
            quantity: newQtySell,
            costBasis: newCostSell,
            realizedPnl: newRealized,
        });
        break;
      }

      case 'DEPOSIT':
      case 'TRANSFER_IN':
      case 'INCOME': {
        const newQtyIn = position.quantity.minus(qty);
        const newAvgIn = newQtyIn.isZero() ? new Prisma.Decimal(0) : position.costBasis.div(newQtyIn);
        await updatePos({
            quantity: newQtyIn,
            avgPrice: newAvgIn
        });
        break;
      }

      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
      case 'FEE': {
         const costRestoredOut = position.avgPrice.mul(qty);
         const newQtyOut = position.quantity.plus(qty);
         const newCostOut = position.costBasis.plus(costRestoredOut);
         await updatePos({
             quantity: newQtyOut,
             costBasis: newCostOut
         });
         break;
      }
    }
  }

  async updateTransaction(
    _userId: bigint,
    transactionId: bigint,
    portfolioId: bigint,
    data: {
        assetId?: bigint | string | number;
        side?: TransactionSide;
        quantity?: number | Prisma.Decimal;
        price?: number | Prisma.Decimal;
        transactionCurrency?: string;
        date?: Date | string;
        userAccountId?: bigint;
        feeAmount?: number | Prisma.Decimal;
        feeCurrency?: string;
        note?: string;
    }
  ): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
        const oldTx = await tx.transaction.findUnique({ where: { id: transactionId } });
        if (!oldTx) throw new NotFoundError('Transaction not found');
        if (oldTx.portfolioId !== portfolioId) throw new BadRequestError('Transaction does not belong to portfolio');

        // 1. Revert Old Effect
        await this.revertTransactionEffect(tx, oldTx, portfolioId);

        // 2. Prepare/Validate New Data
        const merged = {
            assetId: data.assetId ?? oldTx.assetId,
            side: data.side ?? oldTx.side,
            quantity: data.quantity ?? oldTx.quantity,
            price: data.price ?? oldTx.price,
            transactionCurrency: data.transactionCurrency ?? oldTx.transactionCurrency,
            date: data.date ? new Date(data.date) : oldTx.tradeTime,
            userAccountId: data.userAccountId ?? oldTx.userAccountId,
            feeAmount: data.feeAmount ?? oldTx.feeAmount,
            feeCurrency: data.feeCurrency ?? oldTx.feeCurrency,
            note: data.note ?? oldTx.note,
        };

        const qtyDecimal = new Prisma.Decimal(merged.quantity);
        const priceDecimal = new Prisma.Decimal(merged.price);
        const grossAmount = qtyDecimal.mul(priceDecimal);
        const feeAmountDecimal = new Prisma.Decimal(merged.feeAmount);

        this.validateTransaction(merged.side, qtyDecimal, priceDecimal);

        let assetId = BigInt(merged.assetId as any);
        if (data.assetId) {
             const assetService = new AssetService();
             const assetResolved = await assetService.ensureAsset(data.assetId);
             assetId = assetResolved.id;
        }

        const asset = await tx.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new BadRequestError('Asset not found');

        const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });
        if (!portfolio) throw new BadRequestError('Portfolio not found');

        let grossAmountBase = grossAmount;
        let feeAmountBase = feeAmountDecimal;

        if (merged.transactionCurrency !== portfolio.baseCurrency) {
            const fxRate = await this.priceService.getFxRate(merged.transactionCurrency, portfolio.baseCurrency);
            grossAmountBase = grossAmount.mul(fxRate);
            feeAmountBase = feeAmountDecimal.mul(fxRate);
        }

        // 4. Update Transaction Record
        const updatedTx = await tx.transaction.update({
            where: { id: transactionId },
            data: {
                assetId,
                side: merged.side,
                quantity: qtyDecimal,
                price: priceDecimal,
                transactionCurrency: merged.transactionCurrency,
                grossAmount,
                feeAmount: feeAmountDecimal,
                feeCurrency: merged.feeCurrency,
                tradeTime: merged.date,
                note: merged.note,
                userAccountId: merged.userAccountId,
            }
        });

        // 5. Apply New Effect
        await this.updatePositionForTransaction(tx, {
            portfolioId,
            assetId,
            userAccountId: merged.userAccountId,
            side: merged.side,
            quantity: qtyDecimal,
            grossAmountBase,
            feeAmountBase,
            feeAmount: feeAmountDecimal,
            feeCurrency: merged.feeCurrency ?? undefined,
            assetSymbol: asset.symbol,
            priceDecimal: priceDecimal,
            portfolioBaseCurrency: portfolio.baseCurrency,
        });

        return updatedTx;
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
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.portfolioId !== portfolioId) {
        throw new BadRequestError('Transaction does not belong to this portfolio');
      }

      await this.revertTransactionEffect(tx, transaction, portfolioId);

      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });
  }
}

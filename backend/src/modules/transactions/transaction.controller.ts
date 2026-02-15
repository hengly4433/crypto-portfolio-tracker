import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolioId = BigInt(req.params.portfolioId as string);
      const { assetId, side, quantity, price, transactionCurrency, date, userAccountId, feeAmount, feeCurrency, note } = req.body;
      
      const transaction = await this.transactionService.createTransaction({
        portfolioId,
        assetId: assetId,
        side,
        quantity,
        price,
        transactionCurrency,
        date: new Date(date),
        userAccountId: userAccountId ? BigInt(userAccountId) : undefined,
        feeAmount,
        feeCurrency,
        note,
      });

      const response = JSON.parse(JSON.stringify(transaction, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.portfolioId as string);
      const transactionId = BigInt(req.params.transactionId as string);
      const { assetId, side, quantity, price, transactionCurrency, date, userAccountId, feeAmount, feeCurrency, note } = req.body;

      const transaction = await this.transactionService.updateTransaction(userId, transactionId, portfolioId, {
        assetId,
        side,
        quantity,
        price,
        transactionCurrency,
        date,
        userAccountId: userAccountId ? BigInt(userAccountId) : undefined,
        feeAmount,
        feeCurrency,
        note,
      });

      const response = JSON.parse(JSON.stringify(transaction, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getPortfolioTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolioId = BigInt(req.params.portfolioId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.transactionService.getTransactionsPaginated(portfolioId, page, limit);

      const response = JSON.parse(JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolioId = BigInt(req.params.portfolioId as string);
      const transactionId = BigInt(req.params.transactionId as string);

      await this.transactionService.deleteTransaction(transactionId, portfolioId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

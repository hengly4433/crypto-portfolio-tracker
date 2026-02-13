import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // portfolioId from params, assetId from body
      const portfolioId = BigInt(req.params.portfolioId as string);
      const { assetId, side, quantity, price, transactionCurrency, date } = req.body;
      
      const transaction = await this.transactionService.createTransaction({
        portfolioId,
        assetId: BigInt(assetId),
        side,
        quantity,
        price,
        transactionCurrency,
        date: new Date(date),
      });

      const response = JSON.parse(JSON.stringify(transaction, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getPortfolioTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolioId = BigInt(req.params.portfolioId as string);
      const transactions = await this.transactionService.getTransactions(portfolioId);

      const response = JSON.parse(JSON.stringify(transactions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

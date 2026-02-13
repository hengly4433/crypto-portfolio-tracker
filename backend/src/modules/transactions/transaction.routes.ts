import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { z } from 'zod';

const router = Router({ mergeParams: true }); // Enable access to :portfolioId from parent router if nested, but here we might structure routes differently.
// Actually, let's define routes clearly. I'll mount this at /api/portfolios/:portfolioId/transactions

const transactionController = new TransactionController();

const createTransactionSchema = z.object({
  body: z.object({
    assetId: z.string(), // BigInt passed as string in JSON
    side: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive(),
    price: z.number().positive(),
    transactionCurrency: z.string().default('USD'),
    date: z.string().datetime(), // ISO string
  }),
});

router.use(authMiddleware);

router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getPortfolioTransactions);

export default router;

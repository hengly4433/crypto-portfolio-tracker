import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const transactionController = new TransactionController();

const createTransactionSchema = z.object({
  body: z.object({
    assetId: z.string(),
    side: z.enum(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'INCOME', 'FEE']),
    quantity: z.number().positive(),
    price: z.number().min(0),
    transactionCurrency: z.string().default('USD'),
    date: z.string().datetime(),
    userAccountId: z.string().optional(),
    feeAmount: z.number().min(0).optional(),
    feeCurrency: z.string().optional(),
    note: z.string().optional(),
  }),
});

router.use(authMiddleware);

router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getPortfolioTransactions);
router.delete('/:transactionId', transactionController.deleteTransaction);

export default router;

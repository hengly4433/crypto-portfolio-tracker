"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("./transaction.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)({ mergeParams: true }); // Enable access to :portfolioId from parent router if nested, but here we might structure routes differently.
// Actually, let's define routes clearly. I'll mount this at /api/portfolios/:portfolioId/transactions
const transactionController = new transaction_controller_1.TransactionController();
const createTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        assetId: zod_1.z.string(), // BigInt passed as string in JSON
        side: zod_1.z.enum(['BUY', 'SELL']),
        quantity: zod_1.z.number().positive(),
        price: zod_1.z.number().positive(),
        transactionCurrency: zod_1.z.string().default('USD'),
        date: zod_1.z.string().datetime(), // ISO string
    }),
});
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, validate_middleware_1.validate)(createTransactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getPortfolioTransactions);
exports.default = router;

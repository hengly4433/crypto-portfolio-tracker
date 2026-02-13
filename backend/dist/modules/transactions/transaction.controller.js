"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transaction_service_1 = require("./transaction.service");
class TransactionController {
    transactionService;
    constructor() {
        this.transactionService = new transaction_service_1.TransactionService();
    }
    createTransaction = async (req, res, next) => {
        try {
            // portfolioId from params, assetId from body
            const portfolioId = BigInt(req.params.portfolioId);
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
            const response = JSON.parse(JSON.stringify(transaction, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getPortfolioTransactions = async (req, res, next) => {
        try {
            const portfolioId = BigInt(req.params.portfolioId);
            const transactions = await this.transactionService.getTransactions(portfolioId);
            const response = JSON.parse(JSON.stringify(transactions, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.TransactionController = TransactionController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioController = void 0;
const portfolio_service_1 = require("./portfolio.service");
const http_error_1 = require("../../common/errors/http-error");
class PortfolioController {
    portfolioService;
    constructor() {
        this.portfolioService = new portfolio_service_1.PortfolioService();
    }
    createPortfolio = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const { name, baseCurrency } = req.body;
            const portfolio = await this.portfolioService.createPortfolio(userId, name, baseCurrency);
            const response = JSON.parse(JSON.stringify(portfolio, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getMyPortfolios = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const portfolios = await this.portfolioService.getUserPortfolios(userId);
            const response = JSON.parse(JSON.stringify(portfolios, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getPortfolioById = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const portfolioId = BigInt(req.params.id);
            const portfolio = await this.portfolioService.getPortfolioById(portfolioId, userId);
            if (!portfolio) {
                throw new http_error_1.NotFoundError('Portfolio not found');
            }
            const response = JSON.parse(JSON.stringify(portfolio, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getPortfolioSummary = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const portfolioId = BigInt(req.params.id);
            const summary = await this.portfolioService.getPortfolioSummary(portfolioId, userId);
            const response = JSON.parse(JSON.stringify(summary, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getPortfolioPerformance = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const portfolioId = BigInt(req.params.id);
            const days = req.query.days ? parseInt(req.query.days) : 30;
            if (isNaN(days) || days < 1 || days > 365) {
                throw new http_error_1.BadRequestError('Days parameter must be between 1 and 365');
            }
            const performance = await this.portfolioService.getPortfolioPerformance(portfolioId, userId, days);
            const response = JSON.parse(JSON.stringify(performance, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getTopPerformers = async (req, res, next) => {
        try {
            const userId = BigInt(req.user.userId);
            const portfolioId = BigInt(req.params.id);
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            if (isNaN(limit) || limit < 1 || limit > 20) {
                throw new http_error_1.BadRequestError('Limit parameter must be between 1 and 20');
            }
            const topPerformers = await this.portfolioService.getTopPerformers(portfolioId, userId, limit);
            const response = JSON.parse(JSON.stringify(topPerformers, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PortfolioController = PortfolioController;

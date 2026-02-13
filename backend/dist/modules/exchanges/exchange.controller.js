"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeController = void 0;
const exchange_service_1 = require("./exchange.service");
const http_error_1 = require("../../common/errors/http-error");
class ExchangeController {
    exchangeService;
    constructor() {
        this.exchangeService = new exchange_service_1.ExchangeService();
    }
    /**
     * Create a new exchange
     */
    createExchange = async (req, res, next) => {
        try {
            const data = req.body;
            const exchange = await this.exchangeService.createExchange(data);
            const response = JSON.parse(JSON.stringify(exchange, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get all exchanges
     */
    getAllExchanges = async (req, res, next) => {
        try {
            const exchanges = await this.exchangeService.getAllExchanges();
            const response = JSON.parse(JSON.stringify(exchanges, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get exchange by ID
     */
    getExchangeById = async (req, res, next) => {
        try {
            const id = BigInt(req.params.id);
            const exchange = await this.exchangeService.getExchangeById(id);
            const response = JSON.parse(JSON.stringify(exchange, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get exchange by code
     */
    getExchangeByCode = async (req, res, next) => {
        try {
            const code = req.params.code;
            const exchange = await this.exchangeService.getExchangeByCode(code);
            const response = JSON.parse(JSON.stringify(exchange, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update an exchange
     */
    updateExchange = async (req, res, next) => {
        try {
            const id = BigInt(req.params.id);
            const data = req.body;
            const exchange = await this.exchangeService.updateExchange(id, data);
            const response = JSON.parse(JSON.stringify(exchange, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete an exchange
     */
    deleteExchange = async (req, res, next) => {
        try {
            const id = BigInt(req.params.id);
            await this.exchangeService.deleteExchange(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get exchanges by type
     */
    getExchangesByType = async (req, res, next) => {
        try {
            const type = req.params.type;
            const exchanges = await this.exchangeService.getExchangesByType(type);
            const response = JSON.parse(JSON.stringify(exchanges, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get user accounts for an exchange (optional user filtering)
     */
    getExchangeUserAccounts = async (req, res, next) => {
        try {
            const exchangeId = BigInt(req.params.id);
            const userId = req.query.userId ? BigInt(req.query.userId) : undefined;
            const accounts = await this.exchangeService.getExchangeUserAccounts(exchangeId, userId);
            const response = JSON.parse(JSON.stringify(accounts, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get API keys for an exchange (optional user filtering)
     */
    getExchangeApiKeys = async (req, res, next) => {
        try {
            const exchangeId = BigInt(req.params.id);
            const userId = req.query.userId ? BigInt(req.query.userId) : undefined;
            const apiKeys = await this.exchangeService.getExchangeApiKeys(exchangeId, userId);
            const response = JSON.parse(JSON.stringify(apiKeys, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Search exchanges
     */
    searchExchanges = async (req, res, next) => {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                throw new http_error_1.BadRequestError('Search query (q) is required');
            }
            const exchanges = await this.exchangeService.searchExchanges(q);
            const response = JSON.parse(JSON.stringify(exchanges, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get exchange statistics
     */
    getExchangeStats = async (req, res, next) => {
        try {
            const stats = await this.exchangeService.getExchangeStats();
            const response = JSON.parse(JSON.stringify(stats, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ExchangeController = ExchangeController;

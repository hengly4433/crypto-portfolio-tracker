import { Request, Response, NextFunction } from 'express';
import { ExchangeService } from './exchange.service';
import { CreateExchangeDto, UpdateExchangeDto } from './exchange.dto';
import { BadRequestError, NotFoundError } from '../../common/errors/http-error';

export class ExchangeController {
  private exchangeService: ExchangeService;

  constructor() {
    this.exchangeService = new ExchangeService();
  }

  /**
   * Create a new exchange
   */
  createExchange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateExchangeDto = req.body;
      const exchange = await this.exchangeService.createExchange(data);
      
      const response = JSON.parse(JSON.stringify(exchange, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all exchanges
   */
  getAllExchanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exchanges = await this.exchangeService.getAllExchanges();
      
      const response = JSON.parse(JSON.stringify(exchanges, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exchange by ID
   */
  getExchangeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = BigInt(req.params.id as string);
      const exchange = await this.exchangeService.getExchangeById(id);
      
      const response = JSON.parse(JSON.stringify(exchange, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exchange by code
   */
  getExchangeByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const exchange = await this.exchangeService.getExchangeByCode(code);
      
      const response = JSON.parse(JSON.stringify(exchange, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an exchange
   */
  updateExchange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = BigInt(req.params.id as string);
      const data: UpdateExchangeDto = req.body;
      
      const exchange = await this.exchangeService.updateExchange(id, data);
      
      const response = JSON.parse(JSON.stringify(exchange, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an exchange
   */
  deleteExchange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = BigInt(req.params.id as string);
      await this.exchangeService.deleteExchange(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exchanges by type
   */
  getExchangesByType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type as string;
      const exchanges = await this.exchangeService.getExchangesByType(type);
      
      const response = JSON.parse(JSON.stringify(exchanges, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user accounts for an exchange (optional user filtering)
   */
  getExchangeUserAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exchangeId = BigInt(req.params.id as string);
      const userId = req.query.userId ? BigInt(req.query.userId as string) : undefined;
      
      const accounts = await this.exchangeService.getExchangeUserAccounts(exchangeId, userId);
      
      const response = JSON.parse(JSON.stringify(accounts, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get API keys for an exchange (optional user filtering)
   */
  getExchangeApiKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exchangeId = BigInt(req.params.id as string);
      const userId = req.query.userId ? BigInt(req.query.userId as string) : undefined;
      
      const apiKeys = await this.exchangeService.getExchangeApiKeys(exchangeId, userId);
      
      const response = JSON.parse(JSON.stringify(apiKeys, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search exchanges
   */
  searchExchanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Search query (q) is required');
      }
      
      const exchanges = await this.exchangeService.searchExchanges(q);
      
      const response = JSON.parse(JSON.stringify(exchanges, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exchange statistics
   */
  getExchangeStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.exchangeService.getExchangeStats();
      
      const response = JSON.parse(JSON.stringify(stats, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
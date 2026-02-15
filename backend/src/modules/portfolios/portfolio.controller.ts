import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from './portfolio.service';
import { NotFoundError, BadRequestError } from '../../common/errors/http-error';

export class PortfolioController {
  private portfolioService: PortfolioService;

  constructor() {
    this.portfolioService = new PortfolioService();
  }

  createPortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const { name, baseCurrency } = req.body;
      const portfolio = await this.portfolioService.createPortfolio(userId, name, baseCurrency);
      
      const response = JSON.parse(JSON.stringify(portfolio, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updatePortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      const { name, baseCurrency } = req.body;
      
      const portfolio = await this.portfolioService.updatePortfolio(userId, portfolioId, { name, baseCurrency });
      
      const response = JSON.parse(JSON.stringify(portfolio, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getMyPortfolios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolios = await this.portfolioService.getUserPortfolios(userId);
      
      const response = JSON.parse(JSON.stringify(portfolios, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getPortfolioById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      
      const portfolio = await this.portfolioService.getPortfolioById(portfolioId, userId);
      
      if (!portfolio) {
        throw new NotFoundError('Portfolio not found');
      }

      const response = JSON.parse(JSON.stringify(portfolio, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getPortfolioSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      
      const summary = await this.portfolioService.getPortfolioSummary(portfolioId, userId);
      
      const response = JSON.parse(JSON.stringify(summary, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getPortfolioPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      if (isNaN(days) || days < 1 || days > 365) {
        throw new BadRequestError('Days parameter must be between 1 and 365');
      }
      
      const performance = await this.portfolioService.getPortfolioPerformance(portfolioId, userId, days);
      
      const response = JSON.parse(JSON.stringify(performance, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deletePortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      
      await this.portfolioService.deletePortfolio(userId, portfolioId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getTopPerformers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const portfolioId = BigInt(req.params.id as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      if (isNaN(limit) || limit < 1 || limit > 20) {
        throw new BadRequestError('Limit parameter must be between 1 and 20');
      }
      
      const topPerformers = await this.portfolioService.getTopPerformers(portfolioId, userId, limit);
      
      const response = JSON.parse(JSON.stringify(topPerformers, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

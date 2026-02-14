import { Request, Response, NextFunction } from 'express';
import { PriceService } from './price.service';
import { z } from 'zod';
import { validate } from '../../common/middlewares/validate.middleware';
import { BadRequestError } from '../../common/errors/http-error';

const priceService = new PriceService();

const getPriceSchema = z.object({
  params: z.object({
    assetId: z.string().transform(val => BigInt(val)),
  }),
  query: z.object({
    quoteCurrency: z.string().default('USD'),
  }),
});

const getPriceInBaseSchema = z.object({
  params: z.object({
    assetId: z.string().transform(val => BigInt(val)),
  }),
  query: z.object({
    baseCurrency: z.string().default('USD'),
  }),
});

const getFxRateSchema = z.object({
  query: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

export class PriceController {
  static async getPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { assetId } = req.params;
      const quoteCurrency = String(req.query.quoteCurrency || 'USD');

      const price = await priceService.getPrice(BigInt(assetId as string), quoteCurrency);
      
      res.status(200).json({
        success: true,
        data: {
          assetId: assetId.toString(),
          quoteCurrency: quoteCurrency || 'USD',
          price: price.toString(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPriceInBase(req: Request, res: Response, next: NextFunction) {
    try {
      const { assetId } = req.params;
      const baseCurrency = (req.query.baseCurrency as string) || 'USD';

      const price = await priceService.getPriceInBase(BigInt(assetId as string), baseCurrency);
      
      res.status(200).json({
        success: true,
        data: {
          assetId: assetId.toString(),
          baseCurrency: baseCurrency || 'USD',
          price: price.toString(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFxRate(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;

      const rate = await priceService.getFxRate(from, to);
      
      res.status(200).json({
        success: true,
        data: {
          from,
          to,
          rate: rate.toString(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePrices(req: Request, res: Response, next: NextFunction) {
    try {
      // This endpoint triggers manual price updates
      // In production, this should be protected or rate-limited
      await priceService.updateAllPrices();
      
      res.status(200).json({
        success: true,
        message: 'Price update initiated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── New CoinGecko Endpoints ────────────────────────────

  /**
   * Search CoinGecko for coins by name or symbol
   * GET /api/prices/search?q=bitcoin
   */
  static async searchCoins(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        throw new BadRequestError('Query parameter "q" is required');
      }

      const results = await priceService.searchCoins(query.trim());
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch market data with 24h stats for given CoinGecko IDs
   * GET /api/prices/market-data?ids=bitcoin,ethereum&currency=usd&sparkline=false
   */
  static async getMarketData(req: Request, res: Response, next: NextFunction) {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam || idsParam.trim().length === 0) {
        throw new BadRequestError('Query parameter "ids" is required (comma-separated CoinGecko IDs)');
      }

      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      const currency = (req.query.currency as string) || 'usd';
      const sparkline = req.query.sparkline === 'true';

      const data = await priceService.fetchMarketData(ids, currency, sparkline);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch price history for chart rendering
   * GET /api/prices/:assetId/history?days=30&currency=usd
   */
  static async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { assetId } = req.params;

      // Look up the asset to get its coingeckoId
      const { prisma } = await import('../../config/db');
      const asset = await prisma.asset.findUnique({
        where: { id: BigInt(assetId as string) },
      });

      if (!asset) {
        throw new BadRequestError('Asset not found');
      }

      if (!asset.coingeckoId) {
        throw new BadRequestError(`Asset ${asset.symbol} does not have a CoinGecko ID. Price history is only available for crypto assets.`);
      }

      const days = req.query.days ? Number(req.query.days) : 30;
      const currency = (req.query.currency as string) || 'usd';

      // Validate days parameter
      const validDays = [1, 7, 14, 30, 90, 180, 365];
      if (!validDays.includes(days)) {
        throw new BadRequestError(`Invalid days parameter. Valid values: ${validDays.join(', ')}`);
      }

      const history = await priceService.fetchPriceHistory(asset.coingeckoId, days, currency);

      res.status(200).json({
        assetId: assetId.toString(),
        symbol: asset.symbol,
        name: asset.name,
        coingeckoId: asset.coingeckoId,
        days,
        currency,
        points: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
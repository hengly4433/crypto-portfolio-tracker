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
}
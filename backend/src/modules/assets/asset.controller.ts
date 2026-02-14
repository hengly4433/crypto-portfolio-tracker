import { Request, Response, NextFunction } from 'express';
import { AssetService } from './asset.service';
import { PriceService } from '../price/price.service';

export class AssetController {
  private assetService: AssetService;
  private priceService: PriceService;

  constructor() {
    this.assetService = new AssetService();
    this.priceService = new PriceService();
  }

  getAllAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assets = await this.assetService.getAllAssets();
      const response = JSON.parse(JSON.stringify(assets, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.createAsset(req.body);
      const response = JSON.parse(JSON.stringify(asset, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  searchAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      const results = await this.priceService.searchCoins(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { AssetService } from './asset.service';

export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
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
}

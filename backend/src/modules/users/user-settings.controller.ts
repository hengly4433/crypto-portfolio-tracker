import { Request, Response, NextFunction } from 'express';
import { UserSettingsService } from './user-settings.service';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './user-settings.dto';
import { validate } from '../../common/middlewares/validate.middleware';
import { createUserSettingsSchema, updateUserSettingsSchema } from './user-settings.dto';

export class UserSettingsController {
  private userSettingsService: UserSettingsService;

  constructor() {
    this.userSettingsService = new UserSettingsService();
  }

  /**
   * Get current user's settings
   */
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const settings = await this.userSettingsService.getOrCreateUserSettings(userId);
      
      // Convert BigInt to string for JSON serialization
      const response = JSON.parse(JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update current user's settings
   */
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const data: UpdateUserSettingsDto = req.body;
      
      const updatedSettings = await this.userSettingsService.updateUserSettings(userId, data);
      
      // Convert BigInt to string for JSON serialization
      const response = JSON.parse(JSON.stringify(updatedSettings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update only base currency
   */
  updateBaseCurrency = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const { baseCurrency } = req.body;
      
      if (!baseCurrency) {
        return res.status(400).json({ message: 'baseCurrency is required' });
      }

      await this.userSettingsService.updateUserBaseCurrency(userId, baseCurrency);
      
      // Get updated settings
      const settings = await this.userSettingsService.getUserSettings(userId);
      
      const response = JSON.parse(JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
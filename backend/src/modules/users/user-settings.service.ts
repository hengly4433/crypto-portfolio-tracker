import { prisma } from '../../config/db';
import { UserSettings } from '@prisma/client';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './user-settings.dto';
import { NotFoundError } from '../../common/errors/http-error';

export class UserSettingsService {
  /**
   * Create user settings for a new user
   */
  async createUserSettings(userId: bigint, data?: Partial<CreateUserSettingsDto>): Promise<UserSettings> {
    return prisma.userSettings.create({
      data: {
        userId,
        baseCurrency: data?.baseCurrency || 'USD',
        timezone: data?.timezone || 'UTC',
        locale: data?.locale || 'en-US',
        darkMode: data?.darkMode || false,
      },
    });
  }

  /**
   * Get user settings by user ID
   */
  async getUserSettings(userId: bigint): Promise<UserSettings | null> {
    return prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  /**
   * Get user settings or create default if not exists
   */
  async getOrCreateUserSettings(userId: bigint): Promise<UserSettings> {
    let settings = await this.getUserSettings(userId);
    
    if (!settings) {
      settings = await this.createUserSettings(userId);
    }
    
    return settings;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: bigint, data: UpdateUserSettingsDto): Promise<UserSettings> {
    // Check if settings exist
    const existingSettings = await this.getUserSettings(userId);
    if (!existingSettings) {
      // Create settings if they don't exist
      return this.createUserSettings(userId, data);
    }

    return prisma.userSettings.update({
      where: { userId },
      data: {
        baseCurrency: data.baseCurrency,
        timezone: data.timezone,
        locale: data.locale,
        darkMode: data.darkMode,
      },
    });
  }

  /**
   * Delete user settings (usually when user is deleted)
   */
  async deleteUserSettings(userId: bigint): Promise<void> {
    await prisma.userSettings.delete({
      where: { userId },
    });
  }

  /**
   * Get user's base currency
   */
  async getUserBaseCurrency(userId: bigint): Promise<string> {
    const settings = await this.getOrCreateUserSettings(userId);
    return settings.baseCurrency;
  }

  /**
   * Update user's base currency and update all portfolio base currencies
   */
  async updateUserBaseCurrency(userId: bigint, newBaseCurrency: string): Promise<void> {
    // Update user settings
    await this.updateUserSettings(userId, { baseCurrency: newBaseCurrency });
    
    // Update all user's portfolios to use the new base currency
    // Note: This might require recalculating positions and snapshots
    // For now, we'll just update the portfolio base currency
    await prisma.portfolio.updateMany({
      where: { userId },
      data: { baseCurrency: newBaseCurrency },
    });
  }
}
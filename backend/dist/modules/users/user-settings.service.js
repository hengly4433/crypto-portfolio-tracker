"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsService = void 0;
const db_1 = require("../../config/db");
class UserSettingsService {
    /**
     * Create user settings for a new user
     */
    async createUserSettings(userId, data) {
        return db_1.prisma.userSettings.create({
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
    async getUserSettings(userId) {
        return db_1.prisma.userSettings.findUnique({
            where: { userId },
        });
    }
    /**
     * Get user settings or create default if not exists
     */
    async getOrCreateUserSettings(userId) {
        let settings = await this.getUserSettings(userId);
        if (!settings) {
            settings = await this.createUserSettings(userId);
        }
        return settings;
    }
    /**
     * Update user settings
     */
    async updateUserSettings(userId, data) {
        // Check if settings exist
        const existingSettings = await this.getUserSettings(userId);
        if (!existingSettings) {
            // Create settings if they don't exist
            return this.createUserSettings(userId, data);
        }
        return db_1.prisma.userSettings.update({
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
    async deleteUserSettings(userId) {
        await db_1.prisma.userSettings.delete({
            where: { userId },
        });
    }
    /**
     * Get user's base currency
     */
    async getUserBaseCurrency(userId) {
        const settings = await this.getOrCreateUserSettings(userId);
        return settings.baseCurrency;
    }
    /**
     * Update user's base currency and update all portfolio base currencies
     */
    async updateUserBaseCurrency(userId, newBaseCurrency) {
        // Update user settings
        await this.updateUserSettings(userId, { baseCurrency: newBaseCurrency });
        // Update all user's portfolios to use the new base currency
        // Note: This might require recalculating positions and snapshots
        // For now, we'll just update the portfolio base currency
        await db_1.prisma.portfolio.updateMany({
            where: { userId },
            data: { baseCurrency: newBaseCurrency },
        });
    }
}
exports.UserSettingsService = UserSettingsService;

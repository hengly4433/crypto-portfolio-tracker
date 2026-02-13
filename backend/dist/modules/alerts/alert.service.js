"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const db_1 = require("../../config/db");
const client_1 = require("@prisma/client");
const price_service_1 = require("../price/price.service");
const notification_service_1 = require("../notifications/notification.service");
const http_error_1 = require("../../common/errors/http-error");
const client_2 = require("@prisma/client");
class AlertService {
    priceService;
    notificationService;
    constructor() {
        this.priceService = new price_service_1.PriceService();
        this.notificationService = new notification_service_1.NotificationService();
    }
    /**
     * Create a new alert for a user
     */
    async createAlert(userId, data) {
        // Validate that at least one of portfolioId or assetId is provided
        if (!data.portfolioId && !data.assetId) {
            throw new http_error_1.BadRequestError('Either portfolioId or assetId must be provided');
        }
        // Validate portfolio ownership if portfolioId is provided
        if (data.portfolioId) {
            const portfolio = await db_1.prisma.portfolio.findFirst({
                where: { id: data.portfolioId, userId },
            });
            if (!portfolio) {
                throw new http_error_1.BadRequestError('Portfolio not found or access denied');
            }
        }
        // Validate asset exists if assetId is provided
        if (data.assetId) {
            const asset = await db_1.prisma.asset.findUnique({
                where: { id: data.assetId },
            });
            if (!asset) {
                throw new http_error_1.BadRequestError('Asset not found');
            }
        }
        return db_1.prisma.alert.create({
            data: {
                userId,
                portfolioId: data.portfolioId,
                assetId: data.assetId,
                alertType: data.alertType,
                conditionValue: new client_2.Prisma.Decimal(data.conditionValue),
                lookbackWindowMinutes: data.lookbackWindowMinutes,
                isActive: true,
            },
        });
    }
    /**
     * Get all alerts for a user
     */
    async getUserAlerts(userId) {
        return db_1.prisma.alert.findMany({
            where: { userId },
            include: {
                portfolio: true,
                asset: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Get alert by ID with ownership validation
     */
    async getAlertById(userId, alertId) {
        const alert = await db_1.prisma.alert.findUnique({
            where: { id: alertId },
            include: {
                portfolio: true,
                asset: true,
            },
        });
        if (!alert) {
            throw new http_error_1.NotFoundError('Alert not found');
        }
        if (alert.userId !== userId) {
            throw new http_error_1.NotFoundError('Alert not found');
        }
        return alert;
    }
    /**
     * Update an alert
     */
    async updateAlert(userId, alertId, data) {
        // Verify ownership
        await this.getAlertById(userId, alertId);
        return db_1.prisma.alert.update({
            where: { id: alertId },
            data: {
                isActive: data.isActive,
                conditionValue: data.conditionValue ? new client_2.Prisma.Decimal(data.conditionValue) : undefined,
                lookbackWindowMinutes: data.lookbackWindowMinutes,
                lastTriggeredAt: data.isActive === false ? null : undefined, // Reset last triggered when deactivating
            },
        });
    }
    /**
     * Delete an alert
     */
    async deleteAlert(userId, alertId) {
        // Verify ownership
        await this.getAlertById(userId, alertId);
        await db_1.prisma.alert.delete({
            where: { id: alertId },
        });
    }
    /**
     * Check all active alerts (to be called periodically by a job)
     */
    async checkAlerts() {
        const activeAlerts = await db_1.prisma.alert.findMany({
            where: { isActive: true },
            include: {
                asset: true,
                portfolio: {
                    include: {
                        positions: {
                            include: {
                                asset: true,
                            },
                        },
                    },
                },
            },
        });
        const now = new Date();
        for (const alert of activeAlerts) {
            try {
                const shouldTrigger = await this.evaluateAlert(alert, now);
                if (shouldTrigger) {
                    await this.triggerAlert(alert, now);
                }
            }
            catch (error) {
                console.error(`Error evaluating alert ${alert.id}:`, error);
            }
        }
    }
    /**
     * Evaluate if an alert should trigger
     */
    async evaluateAlert(alert, now) {
        // Throttle: Don't trigger if recently triggered (within last 10 minutes)
        if (alert.lastTriggeredAt) {
            const timeSinceLastTrigger = now.getTime() - alert.lastTriggeredAt.getTime();
            const TEN_MINUTES = 10 * 60 * 1000;
            if (timeSinceLastTrigger < TEN_MINUTES) {
                return false;
            }
        }
        switch (alert.alertType) {
            case client_1.AlertType.PRICE_ABOVE:
                return await this.evaluatePriceAboveAlert(alert);
            case client_1.AlertType.PRICE_BELOW:
                return await this.evaluatePriceBelowAlert(alert);
            case client_1.AlertType.PERCENT_CHANGE:
                return await this.evaluatePercentChangeAlert(alert);
            case client_1.AlertType.PORTFOLIO_DRAWDOWN:
                return await this.evaluatePortfolioDrawdownAlert(alert);
            case client_1.AlertType.TARGET_PNL:
                return await this.evaluateTargetPnlAlert(alert);
            default:
                return false;
        }
    }
    /**
     * Evaluate price above alert
     */
    async evaluatePriceAboveAlert(alert) {
        if (!alert.assetId)
            return false;
        try {
            const currentPrice = await this.priceService.getPriceInBase(alert.assetId, alert.portfolio?.baseCurrency || 'USD');
            return currentPrice.gte(alert.conditionValue);
        }
        catch (error) {
            console.error(`Failed to get price for alert ${alert.id}:`, error);
            return false;
        }
    }
    /**
     * Evaluate price below alert
     */
    async evaluatePriceBelowAlert(alert) {
        if (!alert.assetId)
            return false;
        try {
            const currentPrice = await this.priceService.getPriceInBase(alert.assetId, alert.portfolio?.baseCurrency || 'USD');
            return currentPrice.lte(alert.conditionValue);
        }
        catch (error) {
            console.error(`Failed to get price for alert ${alert.id}:`, error);
            return false;
        }
    }
    /**
     * Evaluate percent change alert
     */
    async evaluatePercentChangeAlert(alert) {
        if (!alert.assetId || !alert.lookbackWindowMinutes)
            return false;
        try {
            const currentPrice = await this.priceService.getPriceInBase(alert.assetId, alert.portfolio?.baseCurrency || 'USD');
            // Get historical price (from candles or snapshots)
            // For simplicity, we'll use the price service with a timestamp
            // In production, you would query candles table for historical data
            const lookbackDate = new Date(Date.now() - alert.lookbackWindowMinutes * 60 * 1000);
            // Note: This is a simplified implementation
            // In a real system, you would need historical price data
            const historicalPrice = await this.getHistoricalPrice(alert.assetId, lookbackDate);
            if (!historicalPrice || historicalPrice.isZero()) {
                return false;
            }
            const percentChange = currentPrice.minus(historicalPrice).div(historicalPrice).mul(100);
            return percentChange.abs().gte(alert.conditionValue);
        }
        catch (error) {
            console.error(`Failed to evaluate percent change alert ${alert.id}:`, error);
            return false;
        }
    }
    /**
     * Evaluate portfolio drawdown alert
     */
    async evaluatePortfolioDrawdownAlert(alert) {
        if (!alert.portfolioId)
            return false;
        try {
            const portfolio = alert.portfolio;
            if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
                return false;
            }
            // Calculate current portfolio value
            let currentValue = new client_2.Prisma.Decimal(0);
            for (const position of portfolio.positions) {
                try {
                    const currentPrice = await this.priceService.getPriceInBase(position.assetId, portfolio.baseCurrency);
                    currentValue = currentValue.plus(position.quantity.mul(currentPrice));
                }
                catch (error) {
                    console.error(`Failed to get price for position ${position.id}:`, error);
                }
            }
            // Get historical portfolio value from snapshots
            const lookbackDate = new Date(Date.now() - (alert.lookbackWindowMinutes || 24 * 60) * 60 * 1000);
            const historicalSnapshot = await db_1.prisma.portfolioSnapshot.findFirst({
                where: {
                    portfolioId: alert.portfolioId,
                    createdAt: {
                        gte: lookbackDate,
                    },
                },
                orderBy: { createdAt: 'asc' },
            });
            if (!historicalSnapshot) {
                return false;
            }
            const historicalValue = historicalSnapshot.totalValue;
            if (historicalValue.isZero()) {
                return false;
            }
            const drawdown = currentValue.minus(historicalValue).div(historicalValue).mul(100);
            return drawdown.lte(alert.conditionValue); // Negative percentage for drawdown
        }
        catch (error) {
            console.error(`Failed to evaluate portfolio drawdown alert ${alert.id}:`, error);
            return false;
        }
    }
    /**
     * Evaluate target P&L alert
     */
    async evaluateTargetPnlAlert(alert) {
        if (!alert.portfolioId)
            return false;
        try {
            const portfolio = alert.portfolio;
            if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
                return false;
            }
            // Calculate total P&L
            let totalPnL = new client_2.Prisma.Decimal(0);
            for (const position of portfolio.positions) {
                totalPnL = totalPnL.plus(position.unrealizedPnl).plus(position.realizedPnl);
            }
            return totalPnL.gte(alert.conditionValue);
        }
        catch (error) {
            console.error(`Failed to evaluate target P&L alert ${alert.id}:`, error);
            return false;
        }
    }
    /**
     * Get historical price for an asset at a specific time
     * Note: Simplified implementation - in production, use candles or snapshots
     */
    async getHistoricalPrice(assetId, date) {
        // Try to get from candles table
        const candle = await db_1.prisma.candle.findFirst({
            where: {
                assetId,
                openTime: { lte: date },
                closeTime: { gte: date },
            },
            orderBy: { openTime: 'desc' },
        });
        if (candle) {
            return candle.close;
        }
        // Try to get from price spots (not ideal for historical but works as fallback)
        const priceSpot = await db_1.prisma.priceSpot.findFirst({
            where: {
                assetId,
                fetchedAt: { lte: date },
            },
            orderBy: { fetchedAt: 'desc' },
        });
        return priceSpot?.price || new client_2.Prisma.Decimal(0);
    }
    /**
     * Trigger an alert and create notification
     */
    async triggerAlert(alert, triggeredAt) {
        await db_1.prisma.$transaction(async (tx) => {
            // Update alert last triggered time
            await tx.alert.update({
                where: { id: alert.id },
                data: { lastTriggeredAt: triggeredAt },
            });
        });
        // Create notification using notification service
        // Default to IN_APP channel - in production, users would configure their preferred channel
        const payload = {
            alertType: alert.alertType,
            conditionValue: alert.conditionValue,
            triggeredAt: triggeredAt.toISOString(),
            asset: alert.asset ? { symbol: alert.asset.symbol, name: alert.asset.name } : undefined,
            portfolio: alert.portfolio ? { name: alert.portfolio.name } : undefined,
        };
        await this.notificationService.sendNotification('IN_APP', // Default channel - should be configurable per alert
        payload, alert.userId, alert.id);
    }
    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId) {
        return db_1.prisma.notification.findMany({
            where: { userId },
            include: {
                alert: {
                    include: {
                        asset: true,
                        portfolio: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Mark notification as read/sent
     */
    async markNotificationAsSent(notificationId) {
        await db_1.prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: 'SENT',
                sentAt: new Date(),
            },
        });
    }
}
exports.AlertService = AlertService;

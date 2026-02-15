import { prisma } from '../../config/db';
import { Alert, AlertType } from '@prisma/client';
import { PriceService } from '../price/price.service';
import { NotificationService } from '../notifications/notification.service';
import { BadRequestError, NotFoundError } from '../../common/errors/http-error';
import { Prisma } from '@prisma/client';
import { CreateAlertDto, UpdateAlertDto } from './alert.dto';
import { AssetService } from '../assets/asset.service';

export class AlertService {
  private priceService: PriceService;
  private notificationService: NotificationService;

  constructor() {
    this.priceService = new PriceService();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new alert for a user
   */
  async createAlert(userId: bigint, data: CreateAlertDto): Promise<Alert> {
    // Validate that at least one of portfolioId or assetId is provided
    if (!data.portfolioId && !data.assetId) {
      throw new BadRequestError('Either portfolioId or assetId must be provided');
    }

    // Validate portfolio ownership if portfolioId is provided
    if (data.portfolioId) {
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: data.portfolioId, userId },
      });
      if (!portfolio) {
        throw new BadRequestError('Portfolio not found or access denied');
      }
    }

    // Validate asset exists if assetId is provided
    let finalAssetId: bigint | undefined;
    if (data.assetId) {
      const assetService = new AssetService();
      const asset = await assetService.ensureAsset(data.assetId);
      finalAssetId = asset.id;
    }

    return prisma.alert.create({
      data: {
        userId,
        portfolioId: data.portfolioId,
        assetId: finalAssetId,
        alertType: data.alertType,
        conditionValue: new Prisma.Decimal(data.conditionValue),
        lookbackWindowMinutes: data.lookbackWindowMinutes,
        isActive: true,
      },
    });
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: bigint): Promise<Alert[]> {
    return prisma.alert.findMany({
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
  async getAlertById(userId: bigint, alertId: bigint): Promise<Alert> {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        portfolio: true,
        asset: true,
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new NotFoundError('Alert not found');
    }

    return alert;
  }

  /**
   * Update an alert
   */
  async updateAlert(userId: bigint, alertId: bigint, data: UpdateAlertDto): Promise<Alert> {
    // Verify ownership
    await this.getAlertById(userId, alertId);

    return prisma.alert.update({
      where: { id: alertId },
      data: {
        isActive: data.isActive,
        conditionValue: data.conditionValue ? new Prisma.Decimal(data.conditionValue) : undefined,
        lookbackWindowMinutes: data.lookbackWindowMinutes,
        lastTriggeredAt: data.isActive === false ? null : undefined, // Reset last triggered when deactivating
      },
    });
  }

  /**
   * Delete an alert
   */
  async deleteAlert(userId: bigint, alertId: bigint): Promise<void> {
    // Verify ownership
    await this.getAlertById(userId, alertId);

    await prisma.alert.delete({
      where: { id: alertId },
    });
  }

  /**
   * Check all active alerts (to be called periodically by a job)
   */
  async checkAlerts(): Promise<void> {
    const activeAlerts = await prisma.alert.findMany({
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
      } catch (error) {
        console.error(`Error evaluating alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Evaluate if an alert should trigger
   */
  private async evaluateAlert(alert: any, now: Date): Promise<boolean> {
    // Throttle: Don't trigger if recently triggered (within last 10 minutes)
    if (alert.lastTriggeredAt) {
      const timeSinceLastTrigger = now.getTime() - alert.lastTriggeredAt.getTime();
      const TEN_MINUTES = 10 * 60 * 1000;
      if (timeSinceLastTrigger < TEN_MINUTES) {
        return false;
      }
    }

    switch (alert.alertType) {
      case AlertType.PRICE_ABOVE:
        return await this.evaluatePriceAboveAlert(alert);
      case AlertType.PRICE_BELOW:
        return await this.evaluatePriceBelowAlert(alert);
      case AlertType.PERCENT_CHANGE:
        return await this.evaluatePercentChangeAlert(alert);
      case AlertType.PORTFOLIO_DRAWDOWN:
        return await this.evaluatePortfolioDrawdownAlert(alert);
      case AlertType.TARGET_PNL:
        return await this.evaluateTargetPnlAlert(alert);
      default:
        return false;
    }
  }

  /**
   * Evaluate price above alert
   */
  private async evaluatePriceAboveAlert(alert: any): Promise<boolean> {
    if (!alert.assetId) return false;

    try {
      const currentPrice = await this.priceService.getPriceInBase(
        alert.assetId,
        alert.portfolio?.baseCurrency || 'USD'
      );
      return currentPrice.gte(alert.conditionValue);
    } catch (error) {
      console.error(`Failed to get price for alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate price below alert
   */
  private async evaluatePriceBelowAlert(alert: any): Promise<boolean> {
    if (!alert.assetId) return false;

    try {
      const currentPrice = await this.priceService.getPriceInBase(
        alert.assetId,
        alert.portfolio?.baseCurrency || 'USD'
      );
      return currentPrice.lte(alert.conditionValue);
    } catch (error) {
      console.error(`Failed to get price for alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate percent change alert
   */
  private async evaluatePercentChangeAlert(alert: any): Promise<boolean> {
    if (!alert.assetId || !alert.lookbackWindowMinutes) return false;

    try {
      const currentPrice = await this.priceService.getPriceInBase(
        alert.assetId,
        alert.portfolio?.baseCurrency || 'USD'
      );

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
    } catch (error) {
      console.error(`Failed to evaluate percent change alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate portfolio drawdown alert
   */
  private async evaluatePortfolioDrawdownAlert(alert: any): Promise<boolean> {
    if (!alert.portfolioId) return false;

    try {
      const portfolio = alert.portfolio;
      if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
        return false;
      }

      // Calculate current portfolio value
      let currentValue = new Prisma.Decimal(0);
      for (const position of portfolio.positions) {
        try {
          const currentPrice = await this.priceService.getPriceInBase(
            position.assetId,
            portfolio.baseCurrency
          );
          currentValue = currentValue.plus(position.quantity.mul(currentPrice));
        } catch (error) {
          console.error(`Failed to get price for position ${position.id}:`, error);
        }
      }

      // Get historical portfolio value from snapshots
      const lookbackDate = new Date(Date.now() - (alert.lookbackWindowMinutes || 24 * 60) * 60 * 1000);
      
      const historicalSnapshot = await prisma.portfolioSnapshot.findFirst({
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
    } catch (error) {
      console.error(`Failed to evaluate portfolio drawdown alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate target P&L alert
   */
  private async evaluateTargetPnlAlert(alert: any): Promise<boolean> {
    if (!alert.portfolioId) return false;

    try {
      const portfolio = alert.portfolio;
      if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
        return false;
      }

      // Calculate total P&L
      let totalPnL = new Prisma.Decimal(0);
      for (const position of portfolio.positions) {
        totalPnL = totalPnL.plus(position.unrealizedPnl).plus(position.realizedPnl);
      }

      return totalPnL.gte(alert.conditionValue);
    } catch (error) {
      console.error(`Failed to evaluate target P&L alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Get historical price for an asset at a specific time
   * Note: Simplified implementation - in production, use candles or snapshots
   */
  private async getHistoricalPrice(assetId: bigint, date: Date): Promise<Prisma.Decimal> {
    // Try to get from candles table
    const candle = await prisma.candle.findFirst({
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
    const priceSpot = await prisma.priceSpot.findFirst({
      where: {
        assetId,
        fetchedAt: { lte: date },
      },
      orderBy: { fetchedAt: 'desc' },
    });

    return priceSpot?.price || new Prisma.Decimal(0);
  }

  /**
   * Trigger an alert and create notification
   */
  private async triggerAlert(alert: any, triggeredAt: Date): Promise<void> {
    await prisma.$transaction(async (tx) => {
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

    await this.notificationService.sendNotification(
      'IN_APP', // Default channel - should be configurable per alert
      payload,
      alert.userId,
      alert.id
    );
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: bigint): Promise<any[]> {
    return prisma.notification.findMany({
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
  async markNotificationAsSent(notificationId: bigint): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }
}
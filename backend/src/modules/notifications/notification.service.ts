import { prisma } from '../../config/db';
import { Notification, NotificationChannel, NotificationStatus } from '@prisma/client';

export interface NotificationPayload {
  alertType?: string;
  conditionValue?: number | string;
  triggeredAt?: string;
  asset?: { symbol: string; name: string } | null;
  portfolio?: { name: string } | null;
  message?: string;
  [key: string]: any;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface TelegramOptions {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
}

export interface WebhookOptions {
  url: string;
  payload: any;
  headers?: Record<string, string>;
}

export class NotificationService {
  /**
   * Send notification via specified channel
   */
  async sendNotification(
    channel: NotificationChannel,
    payload: NotificationPayload,
    userId: bigint,
    alertId?: bigint
  ): Promise<Notification> {
    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        alertId,
        channel,
        payload,
        status: 'PENDING',
      },
    });

    // Try to send immediately (in production, this would be queued)
    try {
      await this.deliverNotification(notification, payload);
      
      // Update status to sent
      return await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to send notification ${notification.id}:`, error);
      
      // Update status to failed
      return await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          sentAt: new Date(),
        },
      });
    }
  }

  /**
   * Deliver notification through appropriate channel
   */
  public async deliverNotification(
    notification: Notification,
    payload: NotificationPayload
  ): Promise<void> {
    switch (notification.channel) {
      case 'IN_APP':
        // In-app notifications are already delivered by being stored
        await this.deliverInAppNotification(notification, payload);
        break;
        
      case 'EMAIL':
        await this.deliverEmailNotification(notification, payload);
        break;
        
      case 'TELEGRAM':
        await this.deliverTelegramNotification(notification, payload);
        break;
        
      case 'WEBHOOK':
        await this.deliverWebhookNotification(notification, payload);
        break;
        
      default:
        throw new Error(`Unsupported notification channel: ${notification.channel}`);
    }
  }

  /**
   * Deliver in-app notification (just update status)
   */
  private async deliverInAppNotification(
    notification: Notification,
    payload: NotificationPayload
  ): Promise<void> {
    // In-app notifications are already delivered by being stored in database
    // Frontend will fetch and display them
    console.log(`In-app notification ${notification.id} delivered`);
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(
    notification: Notification,
    payload: NotificationPayload
  ): Promise<void> {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error(`User ${notification.userId} not found`);
    }

    // Generate email content based on alert type
    const emailOptions = this.generateEmailOptions(user.email, payload);
    
    // TODO: Integrate with actual email service (Nodemailer, SendGrid, etc.)
    // For now, just log and simulate success
    console.log(`Would send email to ${user.email}:`, {
      subject: emailOptions.subject,
      preview: emailOptions.text?.substring(0, 100) + '...',
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Deliver Telegram notification
   */
  private async deliverTelegramNotification(
    notification: Notification,
    payload: NotificationPayload
  ): Promise<void> {
    // Get user's Telegram chat ID (would be stored in user settings in production)
    // For now, use environment variable or skip
    const telegramChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
    
    if (!telegramChatId) {
      console.warn('TELEGRAM_DEFAULT_CHAT_ID not set, skipping Telegram notification');
      return;
    }

    const telegramOptions = this.generateTelegramOptions(telegramChatId, payload);
    
    // TODO: Integrate with Telegram Bot API
    // For now, just log
    console.log(`Would send Telegram message to chat ${telegramChatId}:`, {
      text: telegramOptions.text.substring(0, 100) + '...',
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Deliver webhook notification
   */
  private async deliverWebhookNotification(
    notification: Notification,
    payload: NotificationPayload
  ): Promise<void> {
    // Get webhook URL (would be stored in user settings or alert configuration)
    const webhookUrl = process.env.DEFAULT_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('DEFAULT_WEBHOOK_URL not set, skipping webhook notification');
      return;
    }

    const webhookOptions = this.generateWebhookOptions(webhookUrl, payload);
    
    // TODO: Integrate with HTTP client to send webhook
    // For now, just log
    console.log(`Would send webhook to ${webhookUrl}:`, {
      payload: JSON.stringify(webhookOptions.payload).substring(0, 100) + '...',
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Generate email options from notification payload
   */
  private generateEmailOptions(to: string, payload: NotificationPayload): EmailOptions {
    let subject = 'Portfolio Alert';
    let text = '';
    
    if (payload.alertType) {
      switch (payload.alertType) {
        case 'PRICE_ABOVE':
          subject = `💰 ${payload.asset?.symbol} price above ${payload.conditionValue}`;
          text = `The price of ${payload.asset?.name} (${payload.asset?.symbol}) has reached ${payload.conditionValue}.`;
          break;
        case 'PRICE_BELOW':
          subject = `📉 ${payload.asset?.symbol} price below ${payload.conditionValue}`;
          text = `The price of ${payload.asset?.name} (${payload.asset?.symbol}) has fallen below ${payload.conditionValue}.`;
          break;
        case 'PERCENT_CHANGE':
          subject = `📊 ${payload.asset?.symbol} changed by ${payload.conditionValue}%`;
          text = `The price of ${payload.asset?.name} (${payload.asset?.symbol}) has changed by ${payload.conditionValue}%.`;
          break;
        case 'PORTFOLIO_DRAWDOWN':
          subject = `⚠️ Portfolio drawdown alert`;
          text = `Your portfolio ${payload.portfolio?.name} has experienced a drawdown of ${payload.conditionValue}%.`;
          break;
        case 'TARGET_PNL':
          subject = `🎯 Target P&L reached`;
          text = `Your portfolio ${payload.portfolio?.name} has reached the target P&L of ${payload.conditionValue}.`;
          break;
        default:
          subject = 'Portfolio Alert';
          text = JSON.stringify(payload);
      }
    } else if (payload.message) {
      subject = 'Portfolio Notification';
      text = payload.message;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Crypto Portfolio Tracker</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${text}</p>
            <p>Triggered at: ${payload.triggeredAt || new Date().toISOString()}</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/dashboard" class="button">
                View Dashboard
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Crypto Portfolio Tracker.</p>
            <p>You can manage your alert settings in the app.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      to,
      subject,
      html,
      text,
    };
  }

  /**
   * Generate Telegram options from notification payload
   */
  private generateTelegramOptions(chatId: string, payload: NotificationPayload): TelegramOptions {
    let text = '';
    
    if (payload.alertType) {
      const emoji = payload.alertType === 'PRICE_ABOVE' ? '💰' : 
                   payload.alertType === 'PRICE_BELOW' ? '📉' :
                   payload.alertType === 'PERCENT_CHANGE' ? '📊' :
                   payload.alertType === 'PORTFOLIO_DRAWDOWN' ? '⚠️' : '🎯';
      
      text = `${emoji} *Alert Triggered*\\n`;
      
      if (payload.asset) {
        text += `*Asset:* ${payload.asset.name} (${payload.asset.symbol})\\n`;
      }
      
      if (payload.portfolio) {
        text += `*Portfolio:* ${payload.portfolio.name}\\n`;
      }
      
      text += `*Condition:* ${payload.alertType}\\n`;
      text += `*Value:* ${payload.conditionValue}\\n`;
      
      if (payload.triggeredAt) {
        text += `*Time:* ${new Date(payload.triggeredAt).toLocaleString()}`;
      }
    } else if (payload.message) {
      text = payload.message;
    } else {
      text = `Alert triggered: ${JSON.stringify(payload)}`;
    }

    return {
      chatId,
      text,
      parseMode: 'MarkdownV2',
      disableWebPagePreview: true,
    };
  }

  /**
   * Generate webhook options from notification payload
   */
  private generateWebhookOptions(url: string, payload: NotificationPayload): WebhookOptions {
    const webhookPayload = {
      event: 'portfolio_alert',
      timestamp: new Date().toISOString(),
      data: payload,
      metadata: {
        source: 'crypto-portfolio-tracker',
        version: '1.0',
      },
    };

    return {
      url,
      payload: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoPortfolioTracker/1.0',
      },
    };
  }

  /**
   * Get pending notifications for a user
   */
  async getPendingNotifications(userId: bigint): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        status: 'PENDING',
        channel: 'IN_APP', // Only in-app notifications are shown as pending
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark notification as read (for in-app notifications)
   */
  async markAsRead(notificationId: bigint): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        // In a real app, you might have a separate 'read' field
        // For now, we'll just update status
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: bigint) {
    const total = await prisma.notification.count({ where: { userId } });
    const byChannel = await prisma.notification.groupBy({
      by: ['channel'],
      where: { userId },
      _count: { id: true },
    });
    const byStatus = await prisma.notification.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    return {
      total,
      byChannel: byChannel.map(item => ({
        channel: item.channel,
        count: item._count.id,
      })),
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    };
  }
}
import cron from 'node-cron';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';
import { AlertService } from '../../modules/alerts/alert.service';
import { NotificationService } from '../../modules/notifications/notification.service';
import { prisma } from '../../config/db';
import { createModuleLogger } from '../../common/logger/logger';
import { emitAlertTriggered } from '../websocket';

const log = createModuleLogger('alert-check-job');

// Create a queue for alert checks
export const alertCheckQueue = new Queue('alert-checks', { connection: getRedisConnection() });

// Worker to process alert check jobs
export const alertCheckWorker = new Worker('alert-checks', async (job) => {
  log.info({ jobId: job.id }, 'Processing alert check job');
  
  const alertService = new AlertService();
  const triggeredAlerts = await alertService.checkAlerts();
  
  // Emit WebSocket events for each triggered alert
  if (Array.isArray(triggeredAlerts)) {
    for (const alert of triggeredAlerts) {
      emitAlertTriggered(alert.userId.toString(), {
        alertId: alert.id.toString(),
        alertType: alert.alertType,
        conditionValue: alert.conditionValue,
        assetSymbol: alert.asset?.symbol,
        portfolioName: alert.portfolio?.name,
        triggeredAt: new Date().toISOString(),
      });
      log.info({ alertId: alert.id.toString(), userId: alert.userId.toString() }, 'Alert triggered, WebSocket event emitted');
    }
  }
  
  log.info({ jobId: job.id }, 'Completed alert check job');
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const alertQueueEvents = new QueueEvents('alert-checks', { connection: getRedisConnection() });

// Schedule cron job to add alert check to queue every minute
export function scheduleAlertChecks() {
  cron.schedule('* * * * *', async () => {
    log.info('Scheduling alert check job');
    await alertCheckQueue.add('check-alerts', {}, {
      jobId: `alert-check-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  log.info('Alert check scheduler started (every minute)');
}

// Function to process pending notifications (send emails, push notifications, etc.)
export async function processPendingNotifications() {
  log.info('Processing pending notifications');
  
  const notificationService = new NotificationService();
  const pendingNotifications = await prisma.notification.findMany({
    where: { status: 'PENDING' },
    include: {
      alert: {
        include: {
          asset: true,
          portfolio: true,
        },
      },
      user: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 100, // Process in batches
  });

  for (const notification of pendingNotifications) {
    try {
      // Use notification service to deliver
      await notificationService.deliverNotification(notification, notification.payload as any);
      
      // If deliverNotification doesn't throw, mark as sent
      await prisma.notification.update({
        where: { id: notification.id },
        data: { 
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      
      log.info({ notificationId: notification.id, channel: notification.channel }, 'Notification sent');
    } catch (error) {
      log.error({ notificationId: notification.id, error }, 'Failed to process notification');
      
      // Mark as failed after retries
      await prisma.notification.update({
        where: { id: notification.id },
        data: { 
          status: 'FAILED',
          sentAt: new Date(),
        },
      });
    }
  }
}

// Schedule notification processing every 5 minutes
export function scheduleNotificationProcessing() {
  cron.schedule('*/5 * * * *', async () => {
    log.info('Scheduling notification processing');
    await processPendingNotifications();
  });

  log.info('Notification processing scheduler started (every 5 minutes)');
}

// Initialize alert checking and notification processing
export function initializeAlertJobs() {
  scheduleAlertChecks();
  scheduleNotificationProcessing();
  
  // Listen for worker events
  alertCheckWorker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Alert check job completed');
  });

  alertCheckWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, error: err.message }, 'Alert check job failed');
  });

  log.info('Alert checking jobs initialized');
}
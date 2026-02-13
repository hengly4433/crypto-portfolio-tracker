import cron from 'node-cron';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';
import { AlertService } from '../../modules/alerts/alert.service';
import { NotificationService } from '../../modules/notifications/notification.service';
import { prisma } from '../../config/db';

// Redis connection for BullMQ
// Using separate connections to avoid blocking issues

// Create a queue for alert checks
export const alertCheckQueue = new Queue('alert-checks', { connection: getRedisConnection() });

// Worker to process alert check jobs
export const alertCheckWorker = new Worker('alert-checks', async (job) => {
  console.log(`Processing alert check job ${job.id}`);
  
  const alertService = new AlertService();
  await alertService.checkAlerts();
  
  console.log(`Completed alert check job ${job.id}`);
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const alertQueueEvents = new QueueEvents('alert-checks', { connection: getRedisConnection() });

// Schedule cron job to add alert check to queue every minute
export function scheduleAlertChecks() {
  // Every minute: "* * * * *"
  cron.schedule('* * * * *', async () => {
    console.log('Scheduling alert check job...');
    await alertCheckQueue.add('check-alerts', {}, {
      jobId: `alert-check-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  console.log('Alert check scheduler started (every minute)');
}

// Function to process pending notifications (send emails, push notifications, etc.)
export async function processPendingNotifications() {
  console.log('Processing pending notifications...');
  
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
      
      console.log(`Sent notification ${notification.id} via ${notification.channel}`);
    } catch (error) {
      console.error(`Failed to process notification ${notification.id}:`, error);
      
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
  // Every 5 minutes: "*/5 * * * *"
  cron.schedule('*/5 * * * *', async () => {
    console.log('Scheduling notification processing...');
    await processPendingNotifications();
  });

  console.log('Notification processing scheduler started (every 5 minutes)');
}

// Initialize alert checking and notification processing
export function initializeAlertJobs() {
  scheduleAlertChecks();
  scheduleNotificationProcessing();
  
  // Listen for worker events
  alertCheckWorker.on('completed', (job) => {
    console.log(`Alert check job ${job.id} completed`);
  });

  alertCheckWorker.on('failed', (job, err) => {
    console.error(`Alert check job ${job?.id} failed:`, err);
  });

  console.log('Alert checking jobs initialized');
}
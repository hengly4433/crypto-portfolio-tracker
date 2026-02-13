"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertQueueEvents = exports.alertCheckWorker = exports.alertCheckQueue = void 0;
exports.scheduleAlertChecks = scheduleAlertChecks;
exports.processPendingNotifications = processPendingNotifications;
exports.scheduleNotificationProcessing = scheduleNotificationProcessing;
exports.initializeAlertJobs = initializeAlertJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
const alert_service_1 = require("../../modules/alerts/alert.service");
const notification_service_1 = require("../../modules/notifications/notification.service");
const db_1 = require("../../config/db");
// Redis connection for BullMQ
// Using separate connections to avoid blocking issues
// Create a queue for alert checks
exports.alertCheckQueue = new bullmq_1.Queue('alert-checks', { connection: (0, redis_1.getRedisConnection)() });
// Worker to process alert check jobs
exports.alertCheckWorker = new bullmq_1.Worker('alert-checks', async (job) => {
    console.log(`Processing alert check job ${job.id}`);
    const alertService = new alert_service_1.AlertService();
    await alertService.checkAlerts();
    console.log(`Completed alert check job ${job.id}`);
}, { connection: (0, redis_1.getRedisConnection)() });
// Queue events for monitoring
exports.alertQueueEvents = new bullmq_1.QueueEvents('alert-checks', { connection: (0, redis_1.getRedisConnection)() });
// Schedule cron job to add alert check to queue every minute
function scheduleAlertChecks() {
    // Every minute: "* * * * *"
    node_cron_1.default.schedule('* * * * *', async () => {
        console.log('Scheduling alert check job...');
        await exports.alertCheckQueue.add('check-alerts', {}, {
            jobId: `alert-check-${Date.now()}`,
            removeOnComplete: true,
            removeOnFail: false,
        });
    });
    console.log('Alert check scheduler started (every minute)');
}
// Function to process pending notifications (send emails, push notifications, etc.)
async function processPendingNotifications() {
    console.log('Processing pending notifications...');
    const notificationService = new notification_service_1.NotificationService();
    const pendingNotifications = await db_1.prisma.notification.findMany({
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
            await notificationService.deliverNotification(notification, notification.payload);
            // If deliverNotification doesn't throw, mark as sent
            await db_1.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
            console.log(`Sent notification ${notification.id} via ${notification.channel}`);
        }
        catch (error) {
            console.error(`Failed to process notification ${notification.id}:`, error);
            // Mark as failed after retries
            await db_1.prisma.notification.update({
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
function scheduleNotificationProcessing() {
    // Every 5 minutes: "*/5 * * * *"
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        console.log('Scheduling notification processing...');
        await processPendingNotifications();
    });
    console.log('Notification processing scheduler started (every 5 minutes)');
}
// Initialize alert checking and notification processing
function initializeAlertJobs() {
    scheduleAlertChecks();
    scheduleNotificationProcessing();
    // Listen for worker events
    exports.alertCheckWorker.on('completed', (job) => {
        console.log(`Alert check job ${job.id} completed`);
    });
    exports.alertCheckWorker.on('failed', (job, err) => {
        console.error(`Alert check job ${job?.id} failed:`, err);
    });
    console.log('Alert checking jobs initialized');
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceQueueEvents = exports.priceUpdateWorker = exports.priceUpdateQueue = void 0;
exports.schedulePriceUpdates = schedulePriceUpdates;
exports.updatePortfolioSnapshots = updatePortfolioSnapshots;
exports.schedulePortfolioSnapshots = schedulePortfolioSnapshots;
exports.initializeScheduledJobs = initializeScheduledJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const price_service_1 = require("../../modules/price/price.service");
const db_1 = require("../../config/db");
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
const priceService = new price_service_1.PriceService();
// Redis connection for BullMQ
// Using separate connections for Queue, Worker, and QueueEvents to avoid blocking issues
// Create a queue for price updates
exports.priceUpdateQueue = new bullmq_1.Queue('price-updates', { connection: (0, redis_1.getRedisConnection)() });
// Worker to process price update jobs
exports.priceUpdateWorker = new bullmq_1.Worker('price-updates', async (job) => {
    console.log(`Processing price update job ${job.id}`);
    await priceService.updateAllPrices();
    console.log(`Completed price update job ${job.id}`);
}, { connection: (0, redis_1.getRedisConnection)() });
// Queue events for monitoring
exports.priceQueueEvents = new bullmq_1.QueueEvents('price-updates', { connection: (0, redis_1.getRedisConnection)() });
// Schedule cron job to add price update to queue every 5 minutes
function schedulePriceUpdates() {
    // Every 5 minutes: "*/5 * * * *"
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        console.log('Scheduling price update job...');
        await exports.priceUpdateQueue.add('update-prices', {}, {
            jobId: `price-update-${Date.now()}`,
            removeOnComplete: true,
            removeOnFail: false,
        });
    });
    console.log('Price update scheduler started (every 5 minutes)');
}
// Function to update portfolio snapshots after price updates
async function updatePortfolioSnapshots() {
    console.log('Updating portfolio snapshots...');
    const portfolios = await db_1.prisma.portfolio.findMany({
        include: {
            positions: {
                include: {
                    asset: true,
                },
            },
        },
    });
    for (const portfolio of portfolios) {
        let totalValue = 0;
        let totalUnrealizedPnl = 0;
        let totalRealizedPnl = 0;
        for (const position of portfolio.positions) {
            try {
                const currentPrice = await priceService.getPriceInBase(position.assetId, portfolio.baseCurrency);
                const marketValue = position.quantity.mul(currentPrice);
                totalValue += marketValue.toNumber();
                const unrealizedPnl = position.quantity.mul(currentPrice.minus(position.avgPrice));
                totalUnrealizedPnl += unrealizedPnl.toNumber();
                totalRealizedPnl += position.realizedPnl.toNumber();
            }
            catch (error) {
                console.error(`Failed to calculate value for position ${position.id}:`, error);
            }
        }
        // Create portfolio snapshot
        await db_1.prisma.portfolioSnapshot.create({
            data: {
                portfolioId: portfolio.id,
                totalValue: totalValue,
                totalUnrealizedPnl: totalUnrealizedPnl,
                totalRealizedPnl: totalRealizedPnl,
            },
        });
        console.log(`Created snapshot for portfolio ${portfolio.id}: $${totalValue.toFixed(2)}`);
    }
}
// Schedule portfolio snapshot updates every hour
function schedulePortfolioSnapshots() {
    // Every hour: "0 * * * *"
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('Scheduling portfolio snapshot update...');
        await updatePortfolioSnapshots();
    });
    console.log('Portfolio snapshot scheduler started (every hour)');
}
// Initialize all scheduled jobs
function initializeScheduledJobs() {
    schedulePriceUpdates();
    schedulePortfolioSnapshots();
    // Listen for worker events
    exports.priceUpdateWorker.on('completed', (job) => {
        console.log(`Price update job ${job.id} completed`);
    });
    exports.priceUpdateWorker.on('failed', (job, err) => {
        console.error(`Price update job ${job?.id} failed:`, err);
    });
    console.log('All scheduled jobs initialized');
}

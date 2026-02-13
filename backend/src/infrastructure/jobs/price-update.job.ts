import cron from 'node-cron';
import { PriceService } from '../../modules/price/price.service';
import { prisma } from '../../config/db';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';

const priceService = new PriceService();

// Redis connection for BullMQ
// Using separate connections for Queue, Worker, and QueueEvents to avoid blocking issues

// Create a queue for price updates
export const priceUpdateQueue = new Queue('price-updates', { connection: getRedisConnection() });

// Worker to process price update jobs
export const priceUpdateWorker = new Worker('price-updates', async (job) => {
  console.log(`Processing price update job ${job.id}`);
  await priceService.updateAllPrices();
  console.log(`Completed price update job ${job.id}`);
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const priceQueueEvents = new QueueEvents('price-updates', { connection: getRedisConnection() });

// Schedule cron job to add price update to queue every 5 minutes
export function schedulePriceUpdates() {
  // Every 5 minutes: "*/5 * * * *"
  cron.schedule('*/5 * * * *', async () => {
    console.log('Scheduling price update job...');
    await priceUpdateQueue.add('update-prices', {}, {
      jobId: `price-update-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  console.log('Price update scheduler started (every 5 minutes)');
}

// Function to update portfolio snapshots after price updates
export async function updatePortfolioSnapshots() {
  console.log('Updating portfolio snapshots...');
  
  const portfolios = await prisma.portfolio.findMany({
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
        const currentPrice = await priceService.getPriceInBase(
          position.assetId,
          portfolio.baseCurrency
        );
        
        const marketValue = position.quantity.mul(currentPrice);
        totalValue += marketValue.toNumber();
        
        const unrealizedPnl = position.quantity.mul(currentPrice.minus(position.avgPrice));
        totalUnrealizedPnl += unrealizedPnl.toNumber();
        
        totalRealizedPnl += position.realizedPnl.toNumber();
      } catch (error) {
        console.error(`Failed to calculate value for position ${position.id}:`, error);
      }
    }

    // Create portfolio snapshot
    await prisma.portfolioSnapshot.create({
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
export function schedulePortfolioSnapshots() {
  // Every hour: "0 * * * *"
  cron.schedule('0 * * * *', async () => {
    console.log('Scheduling portfolio snapshot update...');
    await updatePortfolioSnapshots();
  });

  console.log('Portfolio snapshot scheduler started (every hour)');
}

// Initialize all scheduled jobs
export function initializeScheduledJobs() {
  schedulePriceUpdates();
  schedulePortfolioSnapshots();
  
  // Listen for worker events
  priceUpdateWorker.on('completed', (job) => {
    console.log(`Price update job ${job.id} completed`);
  });

  priceUpdateWorker.on('failed', (job, err) => {
    console.error(`Price update job ${job?.id} failed:`, err);
  });

  console.log('All scheduled jobs initialized');
}
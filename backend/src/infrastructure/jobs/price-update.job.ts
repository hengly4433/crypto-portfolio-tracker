import cron from 'node-cron';
import { PriceService } from '../../modules/price/price.service';
import { prisma } from '../../config/db';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';
import { createModuleLogger } from '../../common/logger/logger';
import { emitPriceUpdate, emitPortfolioUpdate } from '../websocket';

const log = createModuleLogger('price-update-job');
const priceService = new PriceService();

// Create a queue for price updates
export const priceUpdateQueue = new Queue('price-updates', { connection: getRedisConnection() });

// Worker to process price update jobs
export const priceUpdateWorker = new Worker('price-updates', async (job) => {
  log.info({ jobId: job.id }, 'Processing price update job');
  await priceService.updateAllPrices();
  log.info({ jobId: job.id }, 'Completed price update job');
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const priceQueueEvents = new QueueEvents('price-updates', { connection: getRedisConnection() });

// Schedule cron job to add price update to queue every 5 minutes
export function schedulePriceUpdates() {
  cron.schedule('*/5 * * * *', async () => {
    log.info('Scheduling price update job');
    await priceUpdateQueue.add('update-prices', {}, {
      jobId: `price-update-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  log.info('Price update scheduler started (every 5 minutes)');
}

// Function to update portfolio snapshots after price updates
export async function updatePortfolioSnapshots() {
  log.info('Updating portfolio snapshots');
  
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

        // Emit price update via WebSocket
        emitPriceUpdate({
          assetId: position.assetId.toString(),
          symbol: position.asset.symbol,
          price: currentPrice.toNumber(),
        });
      } catch (error) {
        log.error({ positionId: position.id.toString(), error }, 'Failed to calculate value for position');
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

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio.id.toString(), {
      portfolioId: portfolio.id.toString(),
      totalValue,
      totalUnrealizedPnl,
      totalRealizedPnl,
      snapshotTime: new Date().toISOString(),
    });

    log.info({ portfolioId: portfolio.id, totalValue: totalValue.toFixed(2) }, 'Created portfolio snapshot');
  }
}

// Schedule portfolio snapshot updates every hour
export function schedulePortfolioSnapshots() {
  cron.schedule('0 * * * *', async () => {
    log.info('Scheduling portfolio snapshot update');
    await updatePortfolioSnapshots();
  });

  log.info('Portfolio snapshot scheduler started (every hour)');
}

// Initialize all scheduled jobs
export function initializeScheduledJobs() {
  schedulePriceUpdates();
  schedulePortfolioSnapshots();
  
  // Listen for worker events
  priceUpdateWorker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Price update job completed');
  });

  priceUpdateWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, error: err.message }, 'Price update job failed');
  });

  log.info('All scheduled jobs initialized');
}
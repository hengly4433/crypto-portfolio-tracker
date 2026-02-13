import cron from 'node-cron';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';
import { prisma } from '../../config/db';
import { AuditService } from '../../modules/audit/audit.service';
import { Prisma } from '@prisma/client';

// Redis connection for BullMQ
// Redis connection for BullMQ
// Using separate connections to avoid blocking issues

// Create a queue for candle aggregation
export const candleAggregationQueue = new Queue('candle-aggregation', { connection: getRedisConnection() });

// Worker to process candle aggregation jobs
export const candleAggregationWorker = new Worker('candle-aggregation', async (job) => {
  console.log(`Processing candle aggregation job ${job.id}`);
  
  const { timeframe, assetId } = job.data;
  
  if (timeframe && assetId) {
    // Aggregate specific asset and timeframe
    await aggregateCandlesForAsset(assetId, timeframe);
  } else if (timeframe) {
    // Aggregate all assets for specific timeframe
    await aggregateCandlesForTimeframe(timeframe);
  } else {
    // Aggregate all timeframes for all assets (full aggregation)
    await aggregateAllCandles();
  }
  
  console.log(`Completed candle aggregation job ${job.id}`);
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const candleQueueEvents = new QueueEvents('candle-aggregation', { connection: getRedisConnection() });

/**
 * Aggregate candles for all timeframes and assets
 */
async function aggregateAllCandles(): Promise<void> {
  console.log('Aggregating candles for all timeframes and assets...');
  
  const timeframes = ['M1', 'M5', 'H1', 'D1'];
  
  for (const timeframe of timeframes) {
    await aggregateCandlesForTimeframe(timeframe);
  }
}

/**
 * Aggregate candles for a specific timeframe
 */
async function aggregateCandlesForTimeframe(timeframe: string): Promise<void> {
  console.log(`Aggregating ${timeframe} candles for all assets...`);
  
  const activeAssets = await prisma.asset.findMany({
    where: { isActive: true },
    select: { id: true, symbol: true },
  });
  
  for (const asset of activeAssets) {
    try {
      await aggregateCandlesForAsset(asset.id, timeframe);
    } catch (error) {
      console.error(`Failed to aggregate ${timeframe} candles for asset ${asset.symbol}:`, error);
    }
  }
}

/**
 * Aggregate candles for a specific asset and timeframe
 */
async function aggregateCandlesForAsset(assetId: bigint, timeframe: string): Promise<void> {
  console.log(`Aggregating ${timeframe} candles for asset ${assetId}...`);
  
  // Calculate time window based on timeframe
  let timeWindowMinutes: number;
  switch (timeframe) {
    case 'M1':
      timeWindowMinutes = 1;
      break;
    case 'M5':
      timeWindowMinutes = 5;
      break;
    case 'H1':
      timeWindowMinutes = 60;
      break;
    case 'D1':
      timeWindowMinutes = 24 * 60;
      break;
    default:
      throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  // Get the latest candle for this asset and timeframe
  const latestCandle = await prisma.candle.findFirst({
    where: { assetId, timeframe },
    orderBy: { openTime: 'desc' },
  });
  
  // Determine start time for aggregation
  let startTime = new Date();
  if (latestCandle) {
    // Start from the next period after the latest candle
    startTime = latestCandle.closeTime;
  } else {
    // If no candles exist, start from 7 days ago (or configurable)
    startTime.setDate(startTime.getDate() - 7);
  }
  
  // Get price spots within the time window
  const priceSpots = await prisma.priceSpot.findMany({
    where: {
      assetId,
      fetchedAt: {
        gte: startTime,
      },
    },
    orderBy: { fetchedAt: 'asc' },
  });
  
  if (priceSpots.length === 0) {
    console.log(`No price spots found for asset ${assetId} since ${startTime}`);
    return;
  }
  
  // Group price spots into time buckets
  const candles = groupPriceSpotsIntoCandles(priceSpots, timeframe);
  
  // Insert or update candles
  for (const candle of candles) {
    await prisma.candle.upsert({
      where: {
        assetId_timeframe_openTime: {
          assetId,
          timeframe,
          openTime: candle.openTime,
        },
      },
      update: {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        closeTime: candle.closeTime,
      },
      create: {
        assetId,
        timeframe,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        openTime: candle.openTime,
        closeTime: candle.closeTime,
        source: 'AGGREGATED',
      },
    });
  }
  
  console.log(`Aggregated ${candles.length} ${timeframe} candles for asset ${assetId}`);
}

/**
 * Group price spots into candles based on timeframe
 */
function groupPriceSpotsIntoCandles(priceSpots: any[], timeframe: string): any[] {
  const candles: any[] = [];
  let currentCandle: any = null;
  
  for (const priceSpot of priceSpots) {
    const priceTime = priceSpot.fetchedAt;
    const candleStartTime = getCandleStartTime(priceTime, timeframe);
    
    if (!currentCandle || currentCandle.openTime.getTime() !== candleStartTime.getTime()) {
      // Close previous candle and start new one
      if (currentCandle) {
        candles.push(currentCandle);
      }
      
      currentCandle = {
        openTime: candleStartTime,
        closeTime: getCandleEndTime(candleStartTime, timeframe),
        open: priceSpot.price,
        high: priceSpot.price,
        low: priceSpot.price,
        close: priceSpot.price,
        volume: new Prisma.Decimal(0), // Volume not available from price spots
      };
    } else {
      // Update current candle
      if (priceSpot.price.gt(currentCandle.high)) {
        currentCandle.high = priceSpot.price;
      }
      if (priceSpot.price.lt(currentCandle.low)) {
        currentCandle.low = priceSpot.price;
      }
      currentCandle.close = priceSpot.price;
    }
  }
  
  // Add the last candle
  if (currentCandle) {
    candles.push(currentCandle);
  }
  
  return candles;
}

/**
 * Get candle start time for a given timestamp and timeframe
 */
function getCandleStartTime(timestamp: Date, timeframe: string): Date {
  const date = new Date(timestamp);
  
  switch (timeframe) {
    case 'M1':
      date.setSeconds(0, 0);
      break;
    case 'M5':
      date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
      break;
    case 'H1':
      date.setMinutes(0, 0, 0);
      break;
    case 'D1':
      date.setHours(0, 0, 0, 0);
      break;
    default:
      throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  return date;
}

/**
 * Get candle end time for a given start time and timeframe
 */
function getCandleEndTime(startTime: Date, timeframe: string): Date {
  const endTime = new Date(startTime);
  
  switch (timeframe) {
    case 'M1':
      endTime.setMinutes(endTime.getMinutes() + 1);
      break;
    case 'M5':
      endTime.setMinutes(endTime.getMinutes() + 5);
      break;
    case 'H1':
      endTime.setHours(endTime.getHours() + 1);
      break;
    case 'D1':
      endTime.setDate(endTime.getDate() + 1);
      break;
  }
  
  return endTime;
}

/**
 * Schedule candle aggregation jobs
 */
export function scheduleCandleAggregation(): void {
  // Minute aggregation: every minute
  cron.schedule('* * * * *', async () => {
    console.log('Scheduling M1 candle aggregation...');
    await candleAggregationQueue.add('aggregate-m1', { timeframe: 'M1' }, {
      jobId: `candle-m1-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  // 5-minute aggregation: every 5 minutes at :00, :05, :10, etc.
  cron.schedule('*/5 * * * *', async () => {
    console.log('Scheduling M5 candle aggregation...');
    await candleAggregationQueue.add('aggregate-m5', { timeframe: 'M5' }, {
      jobId: `candle-m5-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  // Hourly aggregation: every hour at :00
  cron.schedule('0 * * * *', async () => {
    console.log('Scheduling H1 candle aggregation...');
    await candleAggregationQueue.add('aggregate-h1', { timeframe: 'H1' }, {
      jobId: `candle-h1-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  // Daily aggregation: every day at 00:05
  cron.schedule('5 0 * * *', async () => {
    console.log('Scheduling D1 candle aggregation...');
    await candleAggregationQueue.add('aggregate-d1', { timeframe: 'D1' }, {
      jobId: `candle-d1-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  // Weekly cleanup of old price spots (keep 30 days)
  cron.schedule('0 1 * * *', async () => {
    console.log('Cleaning up old price spots...');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await prisma.priceSpot.deleteMany({
      where: {
        fetchedAt: {
          lt: cutoffDate,
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} old price spots`);
  });
  
  // Monthly cleanup of old audit logs (keep 90 days)
  cron.schedule('0 2 1 * *', async () => {
    console.log('Cleaning up old audit logs...');
    const auditService = new AuditService();
    const deletedCount = await auditService.cleanupOldLogs(90);
    console.log(`Cleaned up ${deletedCount} old audit logs`);
  });
  
  console.log('Candle aggregation scheduler started');
}

/**
 * Initialize candle aggregation jobs
 */
export function initializeCandleAggregationJobs(): void {
  scheduleCandleAggregation();
  
  // Listen for worker events
  candleAggregationWorker.on('completed', (job) => {
    console.log(`Candle aggregation job ${job.id} completed`);
  });
  
  candleAggregationWorker.on('failed', (job, err) => {
    console.error(`Candle aggregation job ${job?.id} failed:`, err);
  });
  
  console.log('Candle aggregation jobs initialized');
}
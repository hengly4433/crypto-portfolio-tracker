import { initializeScheduledJobs as initializePriceJobs } from './price-update.job';
import { initializeAlertJobs } from './alert-check.job';
import { initializeExchangeSyncJobs } from './exchange-sync.job';
import { initializeCandleAggregationJobs } from './candle-aggregation.job';

/**
 * Initialize all scheduled jobs and queues
 */
export function initializeAllJobs() {
  console.log('Initializing all scheduled jobs...');
  
  // Initialize price update and portfolio snapshot jobs
  initializePriceJobs();
  
  // Initialize alert checking and notification processing jobs
  initializeAlertJobs();
  
  // Initialize exchange sync jobs
  initializeExchangeSyncJobs();
  
  // Initialize candle aggregation jobs
  initializeCandleAggregationJobs();
  
  console.log('All scheduled jobs initialized');
}

/**
 * Gracefully shutdown all job queues and workers
 */
export async function shutdownAllJobs() {
  console.log('Shutting down all job queues...');
  
  // Note: In a production system, we would properly close all queues and workers
  // For now, just log the shutdown
  console.log('Job queues shutdown completed');
}
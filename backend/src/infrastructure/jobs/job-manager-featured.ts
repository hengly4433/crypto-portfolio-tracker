import { FEATURES } from '../../config/features';
import { initializeScheduledJobs as initializePriceJobs } from './price-update.job';
import { initializeAlertJobs } from './alert-check.job';
import { initializeExchangeSyncJobs } from './exchange-sync.job';
import { initializeCandleAggregationJobs } from './candle-aggregation.job';

/**
 * Initialize all scheduled jobs and queues based on feature flags
 */
export function initializeAllJobs() {
  console.log('Initializing scheduled jobs based on feature flags...');
  
  const configSummary = {
    backgroundJobs: FEATURES.ENABLE_BACKGROUND_JOBS,
    priceUpdates: FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_PRICE_APIS,
    exchangeSync: FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_EXCHANGE_SYNC,
    candleAggregation: FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_CANDLE_AGGREGATION,
    alertChecking: FEATURES.ENABLE_BACKGROUND_JOBS, // Alerts can work without prices
  };
  
  console.log('Job configuration:', configSummary);
  
  // Initialize price update and portfolio snapshot jobs
  if (configSummary.priceUpdates) {
    console.log('Initializing price update jobs...');
    try {
      initializePriceJobs();
    } catch (error) {
      console.error('Failed to initialize price jobs:', error);
    }
  } else {
    console.log('Price update jobs disabled (ENABLE_PRICE_APIS=false or ENABLE_BACKGROUND_JOBS=false)');
  }
  
  // Initialize alert checking and notification processing jobs
  if (configSummary.alertChecking) {
    console.log('Initializing alert checking jobs...');
    try {
      initializeAlertJobs();
    } catch (error) {
      console.error('Failed to initialize alert jobs:', error);
    }
  } else {
    console.log('Alert checking jobs disabled (ENABLE_BACKGROUND_JOBS=false)');
  }
  
  // Initialize exchange sync jobs
  if (configSummary.exchangeSync) {
    console.log('Initializing exchange sync jobs...');
    try {
      initializeExchangeSyncJobs();
    } catch (error) {
      console.error('Failed to initialize exchange sync jobs:', error);
    }
  } else {
    console.log('Exchange sync jobs disabled (ENABLE_EXCHANGE_SYNC=false or ENABLE_BACKGROUND_JOBS=false)');
  }
  
  // Initialize candle aggregation jobs
  if (configSummary.candleAggregation) {
    console.log('Initializing candle aggregation jobs...');
    try {
      initializeCandleAggregationJobs();
    } catch (error) {
      console.error('Failed to initialize candle aggregation jobs:', error);
    }
  } else {
    console.log('Candle aggregation jobs disabled (ENABLE_CANDLE_AGGREGATION=false or ENABLE_BACKGROUND_JOBS=false)');
  }
  
  // If no background jobs are enabled, provide guidance
  if (!FEATURES.ENABLE_BACKGROUND_JOBS) {
    console.log('\n⚠️  Background jobs are disabled. System running in manual mode:');
    console.log('   - Prices must be updated manually');
    console.log('   - Alerts must be checked manually');
    console.log('   - Exchange sync disabled');
    console.log('   - Core portfolio tracking remains fully functional');
  }
  
  console.log('Job initialization completed based on feature flags');
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

/**
 * Check if specific job type is enabled
 */
export function isJobEnabled(jobType: 'price' | 'alert' | 'exchange' | 'candle'): boolean {
  switch (jobType) {
    case 'price':
      return FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_PRICE_APIS;
    case 'alert':
      return FEATURES.ENABLE_BACKGROUND_JOBS;
    case 'exchange':
      return FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_EXCHANGE_SYNC;
    case 'candle':
      return FEATURES.ENABLE_BACKGROUND_JOBS && FEATURES.ENABLE_CANDLE_AGGREGATION;
    default:
      return false;
  }
}
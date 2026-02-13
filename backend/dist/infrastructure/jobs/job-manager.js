"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAllJobs = initializeAllJobs;
exports.shutdownAllJobs = shutdownAllJobs;
const price_update_job_1 = require("./price-update.job");
const alert_check_job_1 = require("./alert-check.job");
const exchange_sync_job_1 = require("./exchange-sync.job");
const candle_aggregation_job_1 = require("./candle-aggregation.job");
/**
 * Initialize all scheduled jobs and queues
 */
function initializeAllJobs() {
    console.log('Initializing all scheduled jobs...');
    // Initialize price update and portfolio snapshot jobs
    (0, price_update_job_1.initializeScheduledJobs)();
    // Initialize alert checking and notification processing jobs
    (0, alert_check_job_1.initializeAlertJobs)();
    // Initialize exchange sync jobs
    (0, exchange_sync_job_1.initializeExchangeSyncJobs)();
    // Initialize candle aggregation jobs
    (0, candle_aggregation_job_1.initializeCandleAggregationJobs)();
    console.log('All scheduled jobs initialized');
}
/**
 * Gracefully shutdown all job queues and workers
 */
async function shutdownAllJobs() {
    console.log('Shutting down all job queues...');
    // Note: In a production system, we would properly close all queues and workers
    // For now, just log the shutdown
    console.log('Job queues shutdown completed');
}

import IORedis from 'ioredis';

/**
 * Get a new Redis connection instance with correct configuration for BullMQ
 * BullMQ requires maxRetriesPerRequest to be null for blocking connections (Workers)
 * and it is recommended to use separate connections for Queue, Worker, and QueueEvents
 */
export const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
};

/**
 * Shared Redis connection options if needed
 */
export const redisConnectionOptions = {
  maxRetriesPerRequest: null,
};

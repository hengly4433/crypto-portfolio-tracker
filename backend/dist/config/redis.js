"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = exports.getRedisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Get a new Redis connection instance with correct configuration for BullMQ
 * BullMQ requires maxRetriesPerRequest to be null for blocking connections (Workers)
 * and it is recommended to use separate connections for Queue, Worker, and QueueEvents
 */
const getRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    return new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null,
    });
};
exports.getRedisConnection = getRedisConnection;
/**
 * Shared Redis connection options if needed
 */
exports.redisConnectionOptions = {
    maxRetriesPerRequest: null,
};

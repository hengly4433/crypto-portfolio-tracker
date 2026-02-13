"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExchangeSchema = exports.createExchangeSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createExchangeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        code: zod_1.z.string().min(1).max(20).regex(/^[A-Z_]+$/),
        type: zod_1.z.nativeEnum(client_1.ExchangeType),
        websiteUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    }),
});
exports.updateExchangeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        code: zod_1.z.string().min(1).max(20).regex(/^[A-Z_]+$/).optional(),
        type: zod_1.z.nativeEnum(client_1.ExchangeType).optional(),
        websiteUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    }),
});

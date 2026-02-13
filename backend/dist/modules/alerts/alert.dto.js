"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertSchema = exports.createAlertSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createAlertSchema = zod_1.z.object({
    body: zod_1.z.object({
        portfolioId: zod_1.z.string().optional().transform(val => val ? BigInt(val) : undefined),
        assetId: zod_1.z.string().optional().transform(val => val ? BigInt(val) : undefined),
        alertType: zod_1.z.nativeEnum(client_1.AlertType),
        conditionValue: zod_1.z.number().positive(),
        lookbackWindowMinutes: zod_1.z.number().int().positive().optional(),
    }),
});
exports.updateAlertSchema = zod_1.z.object({
    body: zod_1.z.object({
        isActive: zod_1.z.boolean().optional(),
        conditionValue: zod_1.z.number().positive().optional(),
        lookbackWindowMinutes: zod_1.z.number().int().positive().optional(),
    }),
});

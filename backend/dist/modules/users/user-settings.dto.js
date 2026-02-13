"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSettingsSchema = exports.createUserSettingsSchema = void 0;
const zod_1 = require("zod");
// DTO for creating/updating user settings
exports.createUserSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        baseCurrency: zod_1.z.string().default('USD'),
        timezone: zod_1.z.string().default('UTC'),
        locale: zod_1.z.string().default('en-US'),
        darkMode: zod_1.z.boolean().default(false),
    }),
});
exports.updateUserSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        baseCurrency: zod_1.z.string().optional(),
        timezone: zod_1.z.string().optional(),
        locale: zod_1.z.string().optional(),
        darkMode: zod_1.z.boolean().optional(),
    }),
});

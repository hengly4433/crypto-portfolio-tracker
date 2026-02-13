"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const router = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        fullName: zod_1.z.string().optional(),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
    }),
});
router.post('/register', (0, validate_middleware_1.validate)(registerSchema), async (req, res, next) => {
    try {
        const { email, password, fullName } = req.body;
        const result = await authService.register(email, password, fullName);
        // Handle BigInt serialization
        const response = JSON.parse(JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value));
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', (0, validate_middleware_1.validate)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        const response = JSON.parse(JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value));
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const price_controller_1 = require("./price.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Price routes (protected)
router.get('/:assetId', auth_middleware_1.authMiddleware, price_controller_1.PriceController.getPrice);
router.get('/:assetId/base', auth_middleware_1.authMiddleware, price_controller_1.PriceController.getPriceInBase);
router.get('/fx/rate', auth_middleware_1.authMiddleware, price_controller_1.PriceController.getFxRate);
// Admin endpoint for manual price updates (consider adding admin role check)
router.post('/update-all', auth_middleware_1.authMiddleware, price_controller_1.PriceController.updatePrices);
exports.default = router;

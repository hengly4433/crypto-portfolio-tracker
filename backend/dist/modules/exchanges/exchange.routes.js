"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exchange_controller_1 = require("./exchange.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const exchange_dto_1 = require("./exchange.dto");
const router = (0, express_1.Router)();
const exchangeController = new exchange_controller_1.ExchangeController();
// Apply auth middleware to all exchange routes
router.use(auth_middleware_1.authMiddleware);
// Exchange CRUD routes
router.post('/', (0, validate_middleware_1.validate)(exchange_dto_1.createExchangeSchema), exchangeController.createExchange);
router.get('/', exchangeController.getAllExchanges);
router.get('/search', exchangeController.searchExchanges);
router.get('/stats', exchangeController.getExchangeStats);
// Exchange by ID routes
router.get('/:id', exchangeController.getExchangeById);
router.put('/:id', (0, validate_middleware_1.validate)(exchange_dto_1.updateExchangeSchema), exchangeController.updateExchange);
router.delete('/:id', exchangeController.deleteExchange);
// Exchange by code route
router.get('/code/:code', exchangeController.getExchangeByCode);
// Exchange by type route
router.get('/type/:type', exchangeController.getExchangesByType);
// Exchange relationships routes
router.get('/:id/user-accounts', exchangeController.getExchangeUserAccounts);
router.get('/:id/api-keys', exchangeController.getExchangeApiKeys);
exports.default = router;

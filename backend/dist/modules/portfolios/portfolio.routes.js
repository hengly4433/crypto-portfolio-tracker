"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolio_controller_1 = require("./portfolio.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const portfolioController = new portfolio_controller_1.PortfolioController();
const createPortfolioSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        baseCurrency: zod_1.z.string().default('USD'),
    }),
});
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, validate_middleware_1.validate)(createPortfolioSchema), portfolioController.createPortfolio);
router.get('/', portfolioController.getMyPortfolios);
router.get('/:id', portfolioController.getPortfolioById);
router.get('/:id/summary', portfolioController.getPortfolioSummary);
router.get('/:id/performance', portfolioController.getPortfolioPerformance);
router.get('/:id/top-performers', portfolioController.getTopPerformers);
exports.default = router;

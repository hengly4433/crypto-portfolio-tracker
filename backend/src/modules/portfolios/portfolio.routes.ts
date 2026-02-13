import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const portfolioController = new PortfolioController();

const createPortfolioSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    baseCurrency: z.string().default('USD'),
  }),
});

router.use(authMiddleware);

router.post('/', validate(createPortfolioSchema), portfolioController.createPortfolio);
router.get('/', portfolioController.getMyPortfolios);
router.get('/:id', portfolioController.getPortfolioById);
router.get('/:id/summary', portfolioController.getPortfolioSummary);
router.get('/:id/performance', portfolioController.getPortfolioPerformance);
router.get('/:id/top-performers', portfolioController.getTopPerformers);

export default router;

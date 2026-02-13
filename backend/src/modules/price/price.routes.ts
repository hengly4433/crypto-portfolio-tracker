import { Router } from 'express';
import { PriceController } from './price.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();

// Price routes (protected)
router.get(
  '/:assetId',
  authMiddleware,
  PriceController.getPrice
);

router.get(
  '/:assetId/base',
  authMiddleware,
  PriceController.getPriceInBase
);

router.get(
  '/fx/rate',
  authMiddleware,
  PriceController.getFxRate
);

// Admin endpoint for manual price updates (consider adding admin role check)
router.post(
  '/update-all',
  authMiddleware,
  PriceController.updatePrices
);

export default router;
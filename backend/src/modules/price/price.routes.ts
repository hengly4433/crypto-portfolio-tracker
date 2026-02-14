import { Router } from 'express';
import { PriceController } from './price.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();

// ─── CoinGecko endpoints (must be before /:assetId catch-all) ───

// Search CoinGecko coins
router.get(
  '/search',
  authMiddleware,
  PriceController.searchCoins
);

// Market data with 24h stats
router.get(
  '/market-data',
  authMiddleware,
  PriceController.getMarketData
);

// FX rate endpoint
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

// ─── Asset-specific endpoints (/:assetId catch-all last) ────────

// Price history for charts
router.get(
  '/:assetId/history',
  authMiddleware,
  PriceController.getPriceHistory
);

// Price in base currency
router.get(
  '/:assetId/base',
  authMiddleware,
  PriceController.getPriceInBase
);

// Single price lookup
router.get(
  '/:assetId',
  authMiddleware,
  PriceController.getPrice
);

export default router;
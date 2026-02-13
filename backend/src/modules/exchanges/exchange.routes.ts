import { Router } from 'express';
import { ExchangeController } from './exchange.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { createExchangeSchema, updateExchangeSchema } from './exchange.dto';

const router = Router();
const exchangeController = new ExchangeController();

// Apply auth middleware to all exchange routes
router.use(authMiddleware);

// Exchange CRUD routes
router.post('/', validate(createExchangeSchema), exchangeController.createExchange);
router.get('/', exchangeController.getAllExchanges);
router.get('/search', exchangeController.searchExchanges);
router.get('/stats', exchangeController.getExchangeStats);

// Exchange by ID routes
router.get('/:id', exchangeController.getExchangeById);
router.put('/:id', validate(updateExchangeSchema), exchangeController.updateExchange);
router.delete('/:id', exchangeController.deleteExchange);

// Exchange by code route
router.get('/code/:code', exchangeController.getExchangeByCode);

// Exchange by type route
router.get('/type/:type', exchangeController.getExchangesByType);

// Exchange relationships routes
router.get('/:id/user-accounts', exchangeController.getExchangeUserAccounts);
router.get('/:id/api-keys', exchangeController.getExchangeApiKeys);

export default router;
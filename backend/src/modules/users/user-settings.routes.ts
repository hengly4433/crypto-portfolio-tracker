import { Router } from 'express';
import { UserSettingsController } from './user-settings.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { updateUserSettingsSchema } from './user-settings.dto';

const router = Router();
const userSettingsController = new UserSettingsController();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/users/settings
 * @desc    Get current user's settings
 * @access  Private
 */
router.get('/settings', userSettingsController.getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Update current user's settings
 * @access  Private
 */
router.put(
  '/settings',
  validate(updateUserSettingsSchema),
  userSettingsController.updateSettings
);

/**
 * @route   PATCH /api/users/settings/base-currency
 * @desc    Update user's base currency (and update all portfolios)
 * @access  Private
 */
router.patch('/settings/base-currency', userSettingsController.updateBaseCurrency);

export default router;
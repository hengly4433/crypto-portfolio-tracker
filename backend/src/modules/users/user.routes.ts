import { Router } from 'express';
import { UserController } from './user.controller';
import userSettingsRoutes from './user-settings.routes';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// User profile routes
router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);

// User settings routes
router.use('/', userSettingsRoutes);

export default router;
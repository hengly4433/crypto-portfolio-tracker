import { Router } from 'express';
import { AlertController } from './alert.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { createAlertSchema, updateAlertSchema } from './alert.dto';

const router = Router();
const alertController = new AlertController();

// Apply auth middleware to all alert routes
router.use(authMiddleware);

// Alert routes
router.post('/', validate(createAlertSchema), alertController.createAlert);
router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.put('/:id', validate(updateAlertSchema), alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);

// Notification routes
router.get('/notifications/all', alertController.getNotifications);
router.put('/notifications/:notificationId/read', alertController.markNotificationAsRead);

export default router;
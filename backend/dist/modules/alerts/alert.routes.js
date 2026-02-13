"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alert_controller_1 = require("./alert.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const alert_dto_1 = require("./alert.dto");
const router = (0, express_1.Router)();
const alertController = new alert_controller_1.AlertController();
// Apply auth middleware to all alert routes
router.use(auth_middleware_1.authMiddleware);
// Alert routes
router.post('/', (0, validate_middleware_1.validate)(alert_dto_1.createAlertSchema), alertController.createAlert);
router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.put('/:id', (0, validate_middleware_1.validate)(alert_dto_1.updateAlertSchema), alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);
// Notification routes
router.get('/notifications/all', alertController.getNotifications);
router.put('/notifications/:notificationId/read', alertController.markNotificationAsRead);
exports.default = router;

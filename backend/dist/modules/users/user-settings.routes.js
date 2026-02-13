"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_settings_controller_1 = require("./user-settings.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const user_settings_dto_1 = require("./user-settings.dto");
const router = (0, express_1.Router)();
const userSettingsController = new user_settings_controller_1.UserSettingsController();
// Apply auth middleware to all routes
router.use(auth_middleware_1.authMiddleware);
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
router.put('/settings', (0, validate_middleware_1.validate)(user_settings_dto_1.updateUserSettingsSchema), userSettingsController.updateSettings);
/**
 * @route   PATCH /api/users/settings/base-currency
 * @desc    Update user's base currency (and update all portfolios)
 * @access  Private
 */
router.patch('/settings/base-currency', userSettingsController.updateBaseCurrency);
exports.default = router;

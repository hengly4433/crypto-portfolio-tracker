"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const user_settings_routes_1 = __importDefault(require("./user-settings.routes"));
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// Apply auth middleware to all user routes
router.use(auth_middleware_1.authMiddleware);
// User profile routes
router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
// User settings routes
router.use('/', user_settings_routes_1.default);
exports.default = router;

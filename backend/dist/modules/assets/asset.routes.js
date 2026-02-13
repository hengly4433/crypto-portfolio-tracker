"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asset_controller_1 = require("./asset.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const assetController = new asset_controller_1.AssetController();
// Public routes (or protected? Prompt implementation plan implies API access)
// Let's protect them for now as it's a user app
router.get('/', auth_middleware_1.authMiddleware, assetController.getAllAssets);
router.post('/', auth_middleware_1.authMiddleware, assetController.createAsset);
exports.default = router;

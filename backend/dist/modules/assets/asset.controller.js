"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetController = void 0;
const asset_service_1 = require("./asset.service");
class AssetController {
    assetService;
    constructor() {
        this.assetService = new asset_service_1.AssetService();
    }
    getAllAssets = async (req, res, next) => {
        try {
            const assets = await this.assetService.getAllAssets();
            const response = JSON.parse(JSON.stringify(assets, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    };
    createAsset = async (req, res, next) => {
        try {
            const asset = await this.assetService.createAsset(req.body);
            const response = JSON.parse(JSON.stringify(asset, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AssetController = AssetController;

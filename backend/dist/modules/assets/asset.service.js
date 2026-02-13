"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetService = void 0;
const db_1 = require("../../config/db");
class AssetService {
    async getAllAssets() {
        return db_1.prisma.asset.findMany({
            where: { isActive: true },
        });
    }
    async getAssetById(id) {
        return db_1.prisma.asset.findUnique({
            where: { id },
        });
    }
    async createAsset(data) {
        return db_1.prisma.asset.create({
            data: {
                ...data,
                assetType: 'CRYPTO', // Default for now
                isActive: true,
            },
        });
    }
}
exports.AssetService = AssetService;

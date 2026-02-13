"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceController = void 0;
const price_service_1 = require("./price.service");
const zod_1 = require("zod");
const priceService = new price_service_1.PriceService();
const getPriceSchema = zod_1.z.object({
    params: zod_1.z.object({
        assetId: zod_1.z.string().transform(val => BigInt(val)),
    }),
    query: zod_1.z.object({
        quoteCurrency: zod_1.z.string().default('USD'),
    }),
});
const getPriceInBaseSchema = zod_1.z.object({
    params: zod_1.z.object({
        assetId: zod_1.z.string().transform(val => BigInt(val)),
    }),
    query: zod_1.z.object({
        baseCurrency: zod_1.z.string().default('USD'),
    }),
});
const getFxRateSchema = zod_1.z.object({
    query: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
    }),
});
class PriceController {
    static async getPrice(req, res, next) {
        try {
            const { assetId } = req.params;
            const quoteCurrency = String(req.query.quoteCurrency || 'USD');
            const price = await priceService.getPrice(BigInt(assetId), quoteCurrency);
            res.status(200).json({
                success: true,
                data: {
                    assetId: assetId.toString(),
                    quoteCurrency: quoteCurrency || 'USD',
                    price: price.toString(),
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPriceInBase(req, res, next) {
        try {
            const { assetId } = req.params;
            const baseCurrency = req.query.baseCurrency || 'USD';
            const price = await priceService.getPriceInBase(BigInt(assetId), baseCurrency);
            res.status(200).json({
                success: true,
                data: {
                    assetId: assetId.toString(),
                    baseCurrency: baseCurrency || 'USD',
                    price: price.toString(),
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getFxRate(req, res, next) {
        try {
            const from = req.query.from;
            const to = req.query.to;
            const rate = await priceService.getFxRate(from, to);
            res.status(200).json({
                success: true,
                data: {
                    from,
                    to,
                    rate: rate.toString(),
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePrices(req, res, next) {
        try {
            // This endpoint triggers manual price updates
            // In production, this should be protected or rate-limited
            await priceService.updateAllPrices();
            res.status(200).json({
                success: true,
                message: 'Price update initiated',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PriceController = PriceController;

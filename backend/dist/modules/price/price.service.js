"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../config/db");
const client_1 = require("@prisma/client");
// External API configuration
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';
class PriceService {
    coingeckoApiKey;
    alphaVantageApiKey;
    constructor() {
        this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
        this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    }
    /**
     * Fetch cryptocurrency price from CoinGecko
     */
    async fetchCryptoPrice(coingeckoId, quoteCurrency = 'usd') {
        try {
            const response = await axios_1.default.get(`${COINGECKO_API_URL}/simple/price`, {
                params: {
                    ids: coingeckoId,
                    vs_currencies: quoteCurrency,
                },
            });
            const price = response.data[coingeckoId]?.[quoteCurrency];
            if (!price) {
                throw new Error(`Price not found for ${coingeckoId} in ${quoteCurrency}`);
            }
            return price;
        }
        catch (error) {
            console.error(`Error fetching crypto price for ${coingeckoId}:`, error);
            throw error;
        }
    }
    /**
     * Fetch forex rate from Alpha Vantage
     */
    async fetchForexRate(fromCurrency, toCurrency) {
        try {
            const response = await axios_1.default.get(ALPHA_VANTAGE_API_URL, {
                params: {
                    function: 'CURRENCY_EXCHANGE_RATE',
                    from_currency: fromCurrency,
                    to_currency: toCurrency,
                    apikey: this.alphaVantageApiKey,
                },
            });
            const rate = response.data['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
            if (!rate) {
                throw new Error(`Forex rate not found for ${fromCurrency} to ${toCurrency}`);
            }
            return parseFloat(rate);
        }
        catch (error) {
            console.error(`Error fetching forex rate for ${fromCurrency} to ${toCurrency}:`, error);
            throw error;
        }
    }
    /**
     * Fetch gold price from Alpha Vantage (XAU to USD)
     */
    async fetchGoldPrice(quoteCurrency = 'USD') {
        try {
            // Alpha Vantage doesn't have direct gold API, but we can use metal APIs or fallback
            // For now, we'll use a placeholder or implement with alternative API
            // Using Forex API with XAU as currency code (not always supported)
            return this.fetchForexRate('XAU', quoteCurrency);
        }
        catch (error) {
            console.error(`Error fetching gold price:`, error);
            // Fallback to hardcoded approximate price if API fails
            return 2000; // Approximate gold price per ounce in USD
        }
    }
    /**
     * Get or fetch price for an asset
     */
    async getPrice(assetId, quoteCurrency) {
        // First check if we have a recent price in cache/database
        const recentPrice = await db_1.prisma.priceSpot.findFirst({
            where: {
                assetId,
                quoteCurrency,
                fetchedAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
                },
            },
            orderBy: {
                fetchedAt: 'desc',
            },
        });
        if (recentPrice) {
            return recentPrice.price;
        }
        // Fetch fresh price from external API
        const asset = await db_1.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            throw new Error(`Asset not found with id: ${assetId}`);
        }
        let price;
        switch (asset.assetType) {
            case 'CRYPTO':
                if (!asset.coingeckoId) {
                    throw new Error(`CoinGecko ID not set for asset: ${asset.symbol}`);
                }
                price = await this.fetchCryptoPrice(asset.coingeckoId, quoteCurrency.toLowerCase());
                break;
            case 'FOREX':
                // For forex pairs, we need to parse symbol like "EURUSD"
                const base = asset.symbol.substring(0, 3);
                const quote = asset.symbol.substring(3, 6);
                price = await this.fetchForexRate(base, quote);
                break;
            case 'COMMODITY':
                if (asset.symbol === 'XAUUSD' || asset.symbol === 'XAU') {
                    price = await this.fetchGoldPrice(quoteCurrency);
                }
                else {
                    throw new Error(`Unsupported commodity: ${asset.symbol}`);
                }
                break;
            case 'FIAT':
                // For fiat currencies, get rate vs USD (or other base)
                if (asset.symbol === 'USD') {
                    price = 1;
                }
                else {
                    price = await this.fetchForexRate(asset.symbol, 'USD');
                }
                break;
            default:
                throw new Error(`Unsupported asset type: ${asset.assetType}`);
        }
        // Store price in database
        const priceDecimal = new client_1.Prisma.Decimal(price);
        await db_1.prisma.priceSpot.create({
            data: {
                assetId,
                quoteCurrency,
                price: priceDecimal,
                source: asset.assetType === 'CRYPTO' ? 'COINGECKO' : 'ALPHAVANTAGE',
            },
        });
        return priceDecimal;
    }
    /**
     * Get price in base currency (convert if needed)
     */
    async getPriceInBase(assetId, baseCurrency) {
        const asset = await db_1.prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            throw new Error(`Asset not found with id: ${assetId}`);
        }
        // Determine the quote currency for this asset
        let quoteCurrency = 'USD';
        if (asset.quoteCurrency) {
            quoteCurrency = asset.quoteCurrency;
        }
        else if (asset.assetType === 'CRYPTO') {
            quoteCurrency = 'USDT'; // Default for crypto
        }
        // Get price in quote currency
        const priceInQuote = await this.getPrice(assetId, quoteCurrency);
        // If quote currency equals base currency, no conversion needed
        if (quoteCurrency === baseCurrency) {
            return priceInQuote;
        }
        // Convert to base currency using FX rate
        const fxRate = await this.getFxRate(quoteCurrency, baseCurrency);
        return priceInQuote.mul(fxRate);
    }
    /**
     * Get FX rate between two currencies
     */
    async getFxRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return new client_1.Prisma.Decimal(1);
        }
        // Check for cached rate
        const cachedRate = await db_1.prisma.priceSpot.findFirst({
            where: {
                asset: {
                    symbol: `${fromCurrency}${toCurrency}`,
                    assetType: 'FOREX',
                },
                fetchedAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
            orderBy: {
                fetchedAt: 'desc',
            },
            include: {
                asset: true,
            },
        });
        if (cachedRate) {
            return cachedRate.price;
        }
        // Fetch fresh FX rate
        const rate = await this.fetchForexRate(fromCurrency, toCurrency);
        const rateDecimal = new client_1.Prisma.Decimal(rate);
        // Find or create forex asset
        let forexAsset = await db_1.prisma.asset.findFirst({
            where: {
                symbol: `${fromCurrency}${toCurrency}`,
                assetType: 'FOREX',
            },
        });
        if (!forexAsset) {
            forexAsset = await db_1.prisma.asset.create({
                data: {
                    symbol: `${fromCurrency}${toCurrency}`,
                    name: `${fromCurrency}/${toCurrency}`,
                    assetType: 'FOREX',
                    baseCurrency: fromCurrency,
                    quoteCurrency: toCurrency,
                    precision: 6,
                    isActive: true,
                },
            });
        }
        // Store rate
        await db_1.prisma.priceSpot.create({
            data: {
                assetId: forexAsset.id,
                quoteCurrency: toCurrency,
                price: rateDecimal,
                source: 'ALPHAVANTAGE',
            },
        });
        return rateDecimal;
    }
    /**
     * Batch update prices for all active assets
     */
    async updateAllPrices() {
        const activeAssets = await db_1.prisma.asset.findMany({
            where: { isActive: true },
        });
        const promises = activeAssets.map(async (asset) => {
            try {
                let quoteCurrency = 'USD';
                if (asset.quoteCurrency) {
                    quoteCurrency = asset.quoteCurrency;
                }
                else if (asset.assetType === 'CRYPTO') {
                    quoteCurrency = 'USDT';
                }
                await this.getPrice(asset.id, quoteCurrency);
                console.log(`Updated price for ${asset.symbol}`);
            }
            catch (error) {
                console.error(`Failed to update price for ${asset.symbol}:`, error);
            }
        });
        await Promise.all(promises);
    }
}
exports.PriceService = PriceService;

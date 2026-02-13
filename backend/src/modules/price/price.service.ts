import axios from 'axios';
import { prisma } from '../../config/db';
import { Prisma } from '@prisma/client';
import { getRedisConnection } from '../../config/redis';
import { createModuleLogger } from '../../common/logger/logger';

const log = createModuleLogger('price');

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';

// Redis cache TTL in seconds
const PRICE_CACHE_TTL = 60; // 1 minute
const FX_CACHE_TTL = 300; // 5 minutes

export class PriceService {
  private coingeckoApiKey: string;
  private alphaVantageApiKey: string;
  private redis: ReturnType<typeof getRedisConnection> | null = null;

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    try {
      this.redis = getRedisConnection();
    } catch {
      log.warn('Redis not available, price caching disabled');
    }
  }

  /**
   * Get cached value from Redis
   */
  private async getCached(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  /**
   * Set cached value in Redis
   */
  private async setCache(key: string, value: string, ttl: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.setex(key, ttl, value);
    } catch {
      // Silently fail cache set
    }
  }

  /**
   * Fetch cryptocurrency price from CoinGecko
   */
  async fetchCryptoPrice(coingeckoId: string, quoteCurrency: string = 'usd'): Promise<number> {
    try {
      const response = await axios.get<Record<string, Record<string, number>>>(`${COINGECKO_API_URL}/simple/price`, {
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
    } catch (error) {
      log.error({ coingeckoId, quoteCurrency, error }, 'Error fetching crypto price');
      throw error;
    }
  }

  /**
   * Fetch forex rate from Alpha Vantage
   */
  async fetchForexRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await axios.get<{
        'Realtime Currency Exchange Rate'?: {
          '5. Exchange Rate'?: string;
        };
      }>(ALPHA_VANTAGE_API_URL, {
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
    } catch (error) {
      log.error({ fromCurrency, toCurrency, error }, 'Error fetching forex rate');
      throw error;
    }
  }

  /**
   * Fetch gold price from Alpha Vantage (XAU to USD)
   */
  async fetchGoldPrice(quoteCurrency: string = 'USD'): Promise<number> {
    try {
      return this.fetchForexRate('XAU', quoteCurrency);
    } catch (error) {
      log.error({ quoteCurrency, error }, 'Error fetching gold price');
      return 2000;
    }
  }

  /**
   * Get or fetch price for an asset with Redis caching
   */
  async getPrice(assetId: bigint, quoteCurrency: string): Promise<Prisma.Decimal> {
    // Check Redis cache first
    const cacheKey = `price:${assetId}:${quoteCurrency}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return new Prisma.Decimal(cached);
    }

    // Check database for recent price
    const recentPrice = await prisma.priceSpot.findFirst({
      where: {
        assetId,
        quoteCurrency,
        fetchedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      orderBy: {
        fetchedAt: 'desc',
      },
    });

    if (recentPrice) {
      // Cache in Redis
      await this.setCache(cacheKey, recentPrice.price.toString(), PRICE_CACHE_TTL);
      return recentPrice.price;
    }

    // Fetch fresh price from external API
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error(`Asset not found with id: ${assetId}`);
    }

    let price: number;

    switch (asset.assetType) {
      case 'CRYPTO':
        if (!asset.coingeckoId) {
          throw new Error(`CoinGecko ID not set for asset: ${asset.symbol}`);
        }
        price = await this.fetchCryptoPrice(asset.coingeckoId, quoteCurrency.toLowerCase());
        break;

      case 'FOREX': {
        const base = asset.symbol.substring(0, 3);
        const quote = asset.symbol.substring(3, 6);
        price = await this.fetchForexRate(base, quote);
        break;
      }

      case 'COMMODITY':
        if (asset.symbol === 'XAUUSD' || asset.symbol === 'XAU') {
          price = await this.fetchGoldPrice(quoteCurrency);
        } else {
          throw new Error(`Unsupported commodity: ${asset.symbol}`);
        }
        break;

      case 'FIAT':
        if (asset.symbol === 'USD') {
          price = 1;
        } else {
          price = await this.fetchForexRate(asset.symbol, 'USD');
        }
        break;

      default:
        throw new Error(`Unsupported asset type: ${asset.assetType}`);
    }

    // Store price in database
    const priceDecimal = new Prisma.Decimal(price);
    await prisma.priceSpot.create({
      data: {
        assetId,
        quoteCurrency,
        price: priceDecimal,
        source: asset.assetType === 'CRYPTO' ? 'COINGECKO' : 'ALPHAVANTAGE',
      },
    });

    // Cache in Redis
    await this.setCache(cacheKey, priceDecimal.toString(), PRICE_CACHE_TTL);

    return priceDecimal;
  }

  /**
   * Get price in base currency (convert if needed)
   */
  async getPriceInBase(assetId: bigint, baseCurrency: string): Promise<Prisma.Decimal> {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error(`Asset not found with id: ${assetId}`);
    }

    let quoteCurrency = 'USD';
    if (asset.quoteCurrency) {
      quoteCurrency = asset.quoteCurrency;
    } else if (asset.assetType === 'CRYPTO') {
      quoteCurrency = 'USDT';
    }

    const priceInQuote = await this.getPrice(assetId, quoteCurrency);

    if (quoteCurrency === baseCurrency) {
      return priceInQuote;
    }

    const fxRate = await this.getFxRate(quoteCurrency, baseCurrency);
    return priceInQuote.mul(fxRate);
  }

  /**
   * Get FX rate between two currencies with Redis caching
   */
  async getFxRate(fromCurrency: string, toCurrency: string): Promise<Prisma.Decimal> {
    if (fromCurrency === toCurrency) {
      return new Prisma.Decimal(1);
    }

    // Check Redis cache
    const cacheKey = `fx:${fromCurrency}:${toCurrency}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return new Prisma.Decimal(cached);
    }

    // Check database
    const cachedRate = await prisma.priceSpot.findFirst({
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
      await this.setCache(cacheKey, cachedRate.price.toString(), FX_CACHE_TTL);
      return cachedRate.price;
    }

    // Fetch fresh FX rate
    const rate = await this.fetchForexRate(fromCurrency, toCurrency);
    const rateDecimal = new Prisma.Decimal(rate);

    // Find or create forex asset
    let forexAsset = await prisma.asset.findFirst({
      where: {
        symbol: `${fromCurrency}${toCurrency}`,
        assetType: 'FOREX',
      },
    });

    if (!forexAsset) {
      forexAsset = await prisma.asset.create({
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
    await prisma.priceSpot.create({
      data: {
        assetId: forexAsset.id,
        quoteCurrency: toCurrency,
        price: rateDecimal,
        source: 'ALPHAVANTAGE',
      },
    });

    // Cache in Redis
    await this.setCache(cacheKey, rateDecimal.toString(), FX_CACHE_TTL);

    return rateDecimal;
  }

  /**
   * Batch update prices for all active assets
   */
  async updateAllPrices(): Promise<void> {
    const activeAssets = await prisma.asset.findMany({
      where: { isActive: true },
    });

    const promises = activeAssets.map(async (asset) => {
      try {
        let quoteCurrency = 'USD';
        if (asset.quoteCurrency) {
          quoteCurrency = asset.quoteCurrency;
        } else if (asset.assetType === 'CRYPTO') {
          quoteCurrency = 'USDT';
        }

        await this.getPrice(asset.id, quoteCurrency);
        log.debug({ symbol: asset.symbol }, 'Updated price');
      } catch (error) {
        log.error({ symbol: asset.symbol, error }, 'Failed to update price');
      }
    });

    await Promise.all(promises);
  }
}
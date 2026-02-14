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
const MARKET_DATA_CACHE_TTL = 120; // 2 minutes
const SEARCH_CACHE_TTL = 600; // 10 minutes

// Rate limit: max retries and backoff
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

// ─── CoinGecko Response Types ─────────────────────────────────

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
  marketCap: number;
  volume: number;
}

// ─── PriceService ─────────────────────────────────────────────

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

  // ─── Redis Cache Helpers ──────────────────────────────────

  private async getCached(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  private async setCache(key: string, value: string, ttl: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.setex(key, ttl, value);
    } catch {
      // Silently fail cache set
    }
  }

  // ─── CoinGecko Request Helper ─────────────────────────────

  /**
   * Centralized CoinGecko API request with auth headers and rate-limit retry.
   * Retries up to MAX_RETRIES times on 429 (rate limit) with exponential backoff.
   */
  private async coingeckoRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {},
  ): Promise<T> {
    const config = {
      params,
      headers: {} as Record<string, string>,
    };

    if (this.coingeckoApiKey) {
      (config.headers as Record<string, string>)['x-cg-demo-api-key'] = this.coingeckoApiKey;
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<T>(`${COINGECKO_API_URL}${endpoint}`, config);
        return response.data;
      } catch (error: unknown) {
        const axiosErr = error as { response?: { status?: number } };
        if (axiosErr?.response?.status === 429 && attempt < MAX_RETRIES) {
          const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
          log.warn({ attempt: attempt + 1, backoffMs: backoff }, 'CoinGecko rate limited, retrying...');
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
        throw error;
      }
    }

    throw new Error('CoinGecko request failed after max retries');
  }

  // ─── CoinGecko: Single Price ──────────────────────────────

  /**
   * Fetch cryptocurrency price from CoinGecko
   */
  async fetchCryptoPrice(coingeckoId: string, quoteCurrency: string = 'usd'): Promise<number> {
    try {
      const data = await this.coingeckoRequest<Record<string, Record<string, number>>>(
        '/simple/price',
        { ids: coingeckoId, vs_currencies: quoteCurrency },
      );

      const price = data[coingeckoId]?.[quoteCurrency];
      if (!price) {
        throw new Error(`Price not found for ${coingeckoId} in ${quoteCurrency}`);
      }

      return price;
    } catch (error) {
      log.error({ coingeckoId, quoteCurrency, error }, 'Error fetching crypto price');
      throw error;
    }
  }

  // ─── CoinGecko: Batch Prices ──────────────────────────────

  /**
   * Fetch prices for multiple coins in a single API call.
   * CoinGecko supports comma-separated IDs (up to ~100 per call).
   */
  async fetchBatchPrices(
    coingeckoIds: string[],
    quoteCurrency: string = 'usd',
  ): Promise<Record<string, number>> {
    if (coingeckoIds.length === 0) return {};

    try {
      // CoinGecko recommends max ~250 per request; chunk to 100 for safety
      const CHUNK_SIZE = 100;
      const results: Record<string, number> = {};

      for (let i = 0; i < coingeckoIds.length; i += CHUNK_SIZE) {
        const chunk = coingeckoIds.slice(i, i + CHUNK_SIZE);
        const data = await this.coingeckoRequest<Record<string, Record<string, number>>>(
          '/simple/price',
          {
            ids: chunk.join(','),
            vs_currencies: quoteCurrency,
            include_24hr_change: true,
          },
        );

        for (const id of chunk) {
          if (data[id]?.[quoteCurrency] !== undefined) {
            results[id] = data[id][quoteCurrency];
          }
        }
      }

      log.info({ count: Object.keys(results).length, total: coingeckoIds.length }, 'Batch prices fetched');
      return results;
    } catch (error) {
      log.error({ count: coingeckoIds.length, error }, 'Error fetching batch prices');
      throw error;
    }
  }

  // ─── CoinGecko: Coin Search ───────────────────────────────

  /**
   * Search CoinGecko for coins by name or symbol.
   * Useful when adding new assets to pick the correct coingeckoId.
   */
  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    // Check cache
    const cacheKey = `cg:search:${query.toLowerCase()}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const data = await this.coingeckoRequest<{ coins: CoinSearchResult[] }>(
        '/search',
        { query },
      );

      const results = data.coins.slice(0, 20); // Top 20 results
      await this.setCache(cacheKey, JSON.stringify(results), SEARCH_CACHE_TTL);
      return results;
    } catch (error) {
      log.error({ query, error }, 'Error searching coins');
      throw error;
    }
  }

  // ─── CoinGecko: Market Data ───────────────────────────────

  /**
   * Fetch rich market data: current price, 24h change, market cap, volume, sparkline.
   * Uses /coins/markets endpoint.
   */
  async fetchMarketData(
    coingeckoIds: string[],
    quoteCurrency: string = 'usd',
    includeSparkline: boolean = false,
  ): Promise<CoinMarketData[]> {
    if (coingeckoIds.length === 0) return [];

    // Check cache
    const cacheKey = `cg:market:${coingeckoIds.sort().join(',')}:${quoteCurrency}:${includeSparkline}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const CHUNK_SIZE = 100;
      const allResults: CoinMarketData[] = [];

      for (let i = 0; i < coingeckoIds.length; i += CHUNK_SIZE) {
        const chunk = coingeckoIds.slice(i, i + CHUNK_SIZE);
        const data = await this.coingeckoRequest<CoinMarketData[]>(
          '/coins/markets',
          {
            vs_currency: quoteCurrency,
            ids: chunk.join(','),
            order: 'market_cap_desc',
            per_page: CHUNK_SIZE,
            page: 1,
            sparkline: includeSparkline,
            price_change_percentage: '24h',
          },
        );
        allResults.push(...data);
      }

      await this.setCache(cacheKey, JSON.stringify(allResults), MARKET_DATA_CACHE_TTL);
      log.info({ count: allResults.length }, 'Market data fetched');
      return allResults;
    } catch (error) {
      log.error({ ids: coingeckoIds.join(','), error }, 'Error fetching market data');
      throw error;
    }
  }

  // ─── CoinGecko: Price History ─────────────────────────────

  /**
   * Fetch historical price data for charts.
   * Uses /coins/{id}/market_chart endpoint.
   * @param days — 1, 7, 14, 30, 90, 180, 365, or 'max'
   */
  async fetchPriceHistory(
    coingeckoId: string,
    days: number | string = 30,
    quoteCurrency: string = 'usd',
  ): Promise<PriceHistoryPoint[]> {
    // Check cache
    const cacheKey = `cg:history:${coingeckoId}:${days}:${quoteCurrency}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const data = await this.coingeckoRequest<{
        prices: [number, number][];
        market_caps: [number, number][];
        total_volumes: [number, number][];
      }>(`/coins/${coingeckoId}/market_chart`, {
        vs_currency: quoteCurrency,
        days: days.toString(),
      });

      const points: PriceHistoryPoint[] = data.prices.map((point, index) => ({
        timestamp: point[0],
        price: point[1],
        marketCap: data.market_caps[index]?.[1] ?? 0,
        volume: data.total_volumes[index]?.[1] ?? 0,
      }));

      // Cache shorter for shorter time ranges
      const cacheTtl = Number(days) <= 1 ? 60 : Number(days) <= 7 ? 300 : MARKET_DATA_CACHE_TTL;
      await this.setCache(cacheKey, JSON.stringify(points), cacheTtl);

      log.info({ coingeckoId, days, points: points.length }, 'Price history fetched');
      return points;
    } catch (error) {
      log.error({ coingeckoId, days, error }, 'Error fetching price history');
      throw error;
    }
  }

  // ─── Alpha Vantage: Forex ─────────────────────────────────

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

  // ─── Core: Get / Cache Price ──────────────────────────────

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
      quoteCurrency = 'USD';
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

  // ─── Batch Update ─────────────────────────────────────────

  /**
   * Batch update prices for all active assets.
   * Uses batch fetching for crypto assets to minimize API calls.
   */
  async updateAllPrices(): Promise<void> {
    const activeAssets = await prisma.asset.findMany({
      where: { isActive: true },
    });

    // Separate crypto from non-crypto assets
    const cryptoAssets = activeAssets.filter(a => a.assetType === 'CRYPTO' && a.coingeckoId);
    const otherAssets = activeAssets.filter(a => a.assetType !== 'CRYPTO');

    // Batch fetch all crypto prices in one call
    if (cryptoAssets.length > 0) {
      try {
        const coingeckoIds = cryptoAssets.map(a => a.coingeckoId!);
        // Group by quote currency
        const byCurrency = new Map<string, typeof cryptoAssets>();
        for (const asset of cryptoAssets) {
          const qc = asset.quoteCurrency || 'USDT';
          const group = byCurrency.get(qc) || [];
          group.push(asset);
          byCurrency.set(qc, group);
        }

        for (const [quoteCurrency, assets] of byCurrency) {
          const ids = assets.map(a => a.coingeckoId!);
          const prices = await this.fetchBatchPrices(ids, quoteCurrency.toLowerCase());

          // Store each price in DB and cache
          for (const asset of assets) {
            const price = prices[asset.coingeckoId!];
            if (price !== undefined) {
              const priceDecimal = new Prisma.Decimal(price);
              await prisma.priceSpot.create({
                data: {
                  assetId: asset.id,
                  quoteCurrency,
                  price: priceDecimal,
                  source: 'COINGECKO',
                },
              });
              const cacheKey = `price:${asset.id}:${quoteCurrency}`;
              await this.setCache(cacheKey, priceDecimal.toString(), PRICE_CACHE_TTL);
              log.debug({ symbol: asset.symbol, price }, 'Updated price (batch)');
            }
          }
        }
      } catch (error) {
        log.error({ error }, 'Batch crypto price update failed, falling back to individual');
        // Fallback to individual fetch
        for (const asset of cryptoAssets) {
          try {
            const qc = asset.quoteCurrency || 'USDT';
            await this.getPrice(asset.id, qc);
          } catch (e) {
            log.error({ symbol: asset.symbol, error: e }, 'Failed to update price');
          }
        }
      }
    }

    // Update non-crypto assets individually
    const promises = otherAssets.map(async (asset) => {
      try {
        let quoteCurrency = 'USD';
        if (asset.quoteCurrency) {
          quoteCurrency = asset.quoteCurrency;
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
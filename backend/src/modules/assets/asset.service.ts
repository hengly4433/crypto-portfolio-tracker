import { prisma } from '../../config/db';
import { Asset } from '@prisma/client';
import { PriceService } from '../price/price.service';
import { BadRequestError } from '../../common/errors/http-error';

export class AssetService {
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
  }

  async getAllAssets(): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: { isActive: true },
    });
  }

  async getAssetById(id: bigint): Promise<Asset | null> {
    return prisma.asset.findUnique({
      where: { id },
    });
  }

  async createAsset(data: {
    symbol: string;
    name: string;
    coingeckoId?: string;
  }): Promise<Asset> {
    return prisma.asset.create({
      data: {
        ...data,
        assetType: 'CRYPTO', // Default for now
        isActive: true,
      },
    });
  }

  /**
   * Ensure asset exists (find by ID or CoinGecko ID, or create from CoinGecko)
   */
  async ensureAsset(idOrCoingeckoId: string | bigint | number): Promise<Asset> {
    // 1. Try as numeric ID
    const isNumeric = typeof idOrCoingeckoId === 'bigint' || typeof idOrCoingeckoId === 'number' || /^\d+$/.test(idOrCoingeckoId.toString());
    
    if (isNumeric) {
      const id = BigInt(idOrCoingeckoId);
      const asset = await this.getAssetById(id);
      if (asset) return asset;
      // If numeric but not found, it might be a CoinGecko ID that happens to be numeric? Unlikely.
      // But we should throw if expecting ID.
      throw new BadRequestError(`Asset not found with ID ${id}`);
    }

    const coingeckoId = idOrCoingeckoId.toString();

    // 2. Try to find by CoinGecko ID
    const existing = await prisma.asset.findFirst({
      where: { coingeckoId },
    });
    
    if (existing) return existing;

    // 3. Fetch from CoinGecko and create
    try {
      const [data] = await this.priceService.fetchMarketData([coingeckoId]);
      if (!data) {
        throw new BadRequestError(`Asset definition not found for ${coingeckoId}`);
      }

      return await prisma.asset.create({
        data: {
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          coingeckoId: data.id,
          assetType: 'CRYPTO',
          isActive: true,
          precision: 8,
        },
      });
    } catch (error) {
      console.error(`Failed to resolve asset ${coingeckoId}:`, error);
      throw new BadRequestError(`Failed to resolve asset: ${coingeckoId}`);
    }
  }
}

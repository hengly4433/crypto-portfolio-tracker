import { prisma } from '../../config/db';
import { Asset } from '@prisma/client';

export class AssetService {
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
}

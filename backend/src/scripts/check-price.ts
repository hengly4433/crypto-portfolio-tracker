import { prisma } from '../config/db';
import { PriceService } from '../modules/price/price.service';

// Helper to serialize BigInt
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function main() {
  console.log('--- Checking BTC Asset ---');
  const asset = await prisma.asset.findFirst({
    where: { symbol: 'BTC' },
  });
  console.log('Asset:', asset);

  if (!asset) {
    console.error('BTC Asset not found!');
    return;
  }

  console.log('\n--- Testing Price Service ---');
  const priceService = new PriceService();
  
  try {
    console.log(`Fetching price for assetId: ${asset.id} in USD...`);
    // Pass assetId as bigint
    const price = await priceService.getPrice(asset.id, 'USD');
    console.log('Price (USD):', price.toString());
  } catch (error) {
    console.error('Error fetching price:', error);
  }

  try {
    console.log(`\nFetching price in base currency (USD)...`);
    const priceInBase = await priceService.getPriceInBase(asset.id, 'USD');
    console.log('Price in Base (USD):', priceInBase.toString());
  } catch (error) {
    console.error('Error fetching price in base:', error);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

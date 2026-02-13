import { PrismaClient, ExchangeType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Ensure manual exchange exists
  const manualExchange = await prisma.exchange.upsert({
    where: { code: 'MANUAL' },
    update: {},
    create: {
      name: 'Manual',
      code: 'MANUAL',
      type: ExchangeType.WALLET,
      websiteUrl: null,
    },
  });
  console.log(`✓ Manual exchange: ${manualExchange.name} (${manualExchange.code})`);

  // 2. Seed common crypto assets
  const cryptoAssets = [
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 8 },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 8 },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 8 },
    { symbol: 'XRP', name: 'Ripple', coingeckoId: 'ripple', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
    { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', assetType: 'CRYPTO', quoteCurrency: 'USDT', precision: 6 },
  ];

  for (const assetData of cryptoAssets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetData.symbol },
      update: {
        coingeckoId: assetData.coingeckoId,
        precision: assetData.precision,
      },
      create: {
        symbol: assetData.symbol,
        name: assetData.name,
        assetType: 'CRYPTO',
        baseCurrency: null,
        quoteCurrency: assetData.quoteCurrency,
        coingeckoId: assetData.coingeckoId,
        externalSymbol: null,
        precision: assetData.precision,
        isActive: true,
      },
    });
    console.log(`✓ Crypto asset: ${asset.symbol} - ${asset.name}`);
  }

  // 3. Seed forex pairs
  const forexAssets = [
    { symbol: 'EURUSD', name: 'Euro/US Dollar', assetType: 'FOREX', baseCurrency: 'EUR', quoteCurrency: 'USD', precision: 5 },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar', assetType: 'FOREX', baseCurrency: 'GBP', quoteCurrency: 'USD', precision: 5 },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', assetType: 'FOREX', baseCurrency: 'USD', quoteCurrency: 'JPY', precision: 3 },
    { symbol: 'USDKHR', name: 'US Dollar/Cambodian Riel', assetType: 'FOREX', baseCurrency: 'USD', quoteCurrency: 'KHR', precision: 2 },
    { symbol: 'USDCAD', name: 'US Dollar/Canadian Dollar', assetType: 'FOREX', baseCurrency: 'USD', quoteCurrency: 'CAD', precision: 5 },
    { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', assetType: 'FOREX', baseCurrency: 'AUD', quoteCurrency: 'USD', precision: 5 },
  ];

  for (const assetData of forexAssets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetData.symbol },
      update: {
        precision: assetData.precision,
      },
      create: {
        symbol: assetData.symbol,
        name: assetData.name,
        assetType: 'FOREX',
        baseCurrency: assetData.baseCurrency,
        quoteCurrency: assetData.quoteCurrency,
        coingeckoId: null,
        externalSymbol: null,
        precision: assetData.precision,
        isActive: true,
      },
    });
    console.log(`✓ Forex pair: ${asset.symbol} - ${asset.name}`);
  }

  // 4. Seed commodities
  const commodityAssets = [
    { symbol: 'XAUUSD', name: 'Gold/US Dollar', assetType: 'COMMODITY', baseCurrency: 'XAU', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'XAGUSD', name: 'Silver/US Dollar', assetType: 'COMMODITY', baseCurrency: 'XAG', quoteCurrency: 'USD', precision: 3 },
  ];

  for (const assetData of commodityAssets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetData.symbol },
      update: {
        precision: assetData.precision,
      },
      create: {
        symbol: assetData.symbol,
        name: assetData.name,
        assetType: 'COMMODITY',
        baseCurrency: assetData.baseCurrency,
        quoteCurrency: assetData.quoteCurrency,
        coingeckoId: null,
        externalSymbol: null,
        precision: assetData.precision,
        isActive: true,
      },
    });
    console.log(`✓ Commodity: ${asset.symbol} - ${asset.name}`);
  }

  // 5. Seed fiat currencies
  const fiatAssets = [
    { symbol: 'USD', name: 'US Dollar', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
    { symbol: 'EUR', name: 'Euro', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
    { symbol: 'GBP', name: 'British Pound', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
    { symbol: 'KHR', name: 'Cambodian Riel', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
    { symbol: 'JPY', name: 'Japanese Yen', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 0 },
    { symbol: 'CAD', name: 'Canadian Dollar', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
    { symbol: 'AUD', name: 'Australian Dollar', assetType: 'FIAT', baseCurrency: null, quoteCurrency: null, precision: 2 },
  ];

  for (const assetData of fiatAssets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetData.symbol },
      update: {
        precision: assetData.precision,
      },
      create: {
        symbol: assetData.symbol,
        name: assetData.name,
        assetType: 'FIAT',
        baseCurrency: null,
        quoteCurrency: null,
        coingeckoId: null,
        externalSymbol: null,
        precision: assetData.precision,
        isActive: true,
      },
    });
    console.log(`✓ Fiat currency: ${asset.symbol} - ${asset.name}`);
  }

  // 6. Seed popular exchanges
  const exchanges = [
    { name: 'Binance', code: 'BINANCE', type: ExchangeType.CEX, websiteUrl: 'https://binance.com' },
    { name: 'OKX', code: 'OKX', type: ExchangeType.CEX, websiteUrl: 'https://okx.com' },
    { name: 'Coinbase', code: 'COINBASE', type: ExchangeType.CEX, websiteUrl: 'https://coinbase.com' },
    { name: 'Kraken', code: 'KRAKEN', type: ExchangeType.CEX, websiteUrl: 'https://kraken.com' },
    { name: 'MetaMask', code: 'METAMASK', type: ExchangeType.WALLET, websiteUrl: 'https://metamask.io' },
    { name: 'Uniswap', code: 'UNISWAP', type: ExchangeType.DEX, websiteUrl: 'https://uniswap.org' },
    { name: 'Interactive Brokers', code: 'IBKR', type: ExchangeType.BROKER, websiteUrl: 'https://interactivebrokers.com' },
  ];

  for (const exchangeData of exchanges) {
    const exchange = await prisma.exchange.upsert({
      where: { code: exchangeData.code },
      update: {},
      create: {
        name: exchangeData.name,
        code: exchangeData.code,
        type: exchangeData.type,
        websiteUrl: exchangeData.websiteUrl,
      },
    });
    console.log(`✓ Exchange: ${exchange.name} (${exchange.code})`);
  }

  console.log('\n✅ Database seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
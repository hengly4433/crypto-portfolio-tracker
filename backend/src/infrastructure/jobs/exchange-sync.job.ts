import cron from 'node-cron';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../../config/redis';
import { prisma } from '../../config/db';
import { ExchangeType, TransactionSide } from '@prisma/client';
import { ExchangeClientFactory } from '../../modules/exchanges/exchange-client.factory';
import { BinanceClient } from '../../modules/exchanges/binance-client';
import { encryptionService } from '../../common/utils/encryption';
import { Prisma } from '@prisma/client';

// Redis connection for BullMQ
// Redis connection for BullMQ
// Using separate connections to avoid blocking issues

// Create a queue for exchange sync
export const exchangeSyncQueue = new Queue('exchange-sync', { connection: getRedisConnection() });

// Worker to process exchange sync jobs
export const exchangeSyncWorker = new Worker('exchange-sync', async (job) => {
  console.log(`Processing exchange sync job ${job.id}`);
  
  const { userId, exchangeId, apiKeyId } = job.data;
  
  if (userId && exchangeId && apiKeyId) {
    // Sync specific user's exchange account
    await syncUserExchangeAccount(userId, exchangeId, apiKeyId);
  } else if (userId) {
    // Sync all exchange accounts for a user
    await syncAllUserExchangeAccounts(userId);
  } else {
    // Sync all active exchange accounts
    await syncAllExchangeAccounts();
  }
  
  console.log(`Completed exchange sync job ${job.id}`);
}, { connection: getRedisConnection() });

// Queue events for monitoring
export const exchangeQueueEvents = new QueueEvents('exchange-sync', { connection: getRedisConnection() });

/**
 * Sync all active exchange accounts
 */
async function syncAllExchangeAccounts(): Promise<void> {
  console.log('Syncing all active exchange accounts...');
  
  const activeApiKeys = await prisma.userApiKey.findMany({
    where: { isActive: true },
    include: {
      user: true,
      exchange: true,
    },
  });
  
  for (const apiKey of activeApiKeys) {
    try {
      console.log(`Syncing ${apiKey.exchange.name} account for user ${apiKey.user.email}`);
      await syncExchangeAccount(apiKey);
    } catch (error) {
      console.error(`Failed to sync ${apiKey.exchange.name} for user ${apiKey.user.email}:`, error);
    }
  }
}

/**
 * Sync all exchange accounts for a specific user
 */
async function syncAllUserExchangeAccounts(userId: bigint): Promise<void> {
  console.log(`Syncing all exchange accounts for user ${userId}...`);
  
  const userApiKeys = await prisma.userApiKey.findMany({
    where: { userId, isActive: true },
    include: {
      exchange: true,
    },
  });
  
  for (const apiKey of userApiKeys) {
    try {
      await syncExchangeAccount(apiKey);
    } catch (error) {
      console.error(`Failed to sync ${apiKey.exchange.name} for user ${userId}:`, error);
    }
  }
}

/**
 * Sync specific user exchange account
 */
async function syncUserExchangeAccount(userId: bigint, exchangeId: bigint, apiKeyId: bigint): Promise<void> {
  console.log(`Syncing exchange account ${apiKeyId} for user ${userId}...`);
  
  const apiKey = await prisma.userApiKey.findFirst({
    where: { id: apiKeyId, userId, exchangeId, isActive: true },
    include: {
      exchange: true,
      user: true,
    },
  });
  
  if (!apiKey) {
    throw new Error(`Active API key not found: userId=${userId}, exchangeId=${exchangeId}, apiKeyId=${apiKeyId}`);
  }
  
  await syncExchangeAccount(apiKey);
}

/**
 * Sync exchange account using API key
 */
async function syncExchangeAccount(apiKey: any): Promise<void> {
  const { exchange, user } = apiKey;
  
  console.log(`Starting sync for ${exchange.name} (${exchange.code}) - User: ${user.email}`);
  
  // API keys are already decrypted in syncCentralizedExchange function
  // The decryption happens there to avoid storing decrypted keys in memory longer than necessary
  
  switch (exchange.type) {
    case ExchangeType.CEX:
      await syncCentralizedExchange(apiKey, exchange);
      break;
    case ExchangeType.DEX:
      await syncDecentralizedExchange(apiKey, exchange);
      break;
    case ExchangeType.WALLET:
      await syncWallet(apiKey, exchange);
      break;
    case ExchangeType.BROKER:
      await syncBroker(apiKey, exchange);
      break;
    default:
      console.warn(`Unsupported exchange type: ${exchange.type}`);
  }
  
  // Update last sync timestamp
  await prisma.userApiKey.update({
    where: { id: apiKey.id },
    data: { updatedAt: new Date() },
  });
  
  console.log(`Completed sync for ${exchange.name} - User: ${user.email}`);
}

  /**
   * Sync centralized exchange (Binance, OKX, Coinbase, etc.)
   */
  async function syncCentralizedExchange(apiKey: any, exchange: any): Promise<void> {
    console.log(`Syncing CEX: ${exchange.name} (${exchange.code})`);
    
    try {
      // Decrypt API keys
      const decryptedApiKey = encryptionService.decrypt(apiKey.apiKeyEncrypted);
      const decryptedApiSecret = encryptionService.decrypt(apiKey.apiSecretEncrypted);
      const decryptedPassphrase = apiKey.passphraseEncrypted 
        ? encryptionService.decrypt(apiKey.passphraseEncrypted)
        : undefined;
      
      // Create exchange client
      const client = ExchangeClientFactory.createClient(
        exchange.code,
        decryptedApiKey,
        decryptedApiSecret,
        decryptedPassphrase
      );
      
      // Test connection first
      const isConnected = await client.testConnection();
      if (!isConnected) {
        throw new Error(`Failed to connect to ${exchange.name}`);
      }
      
      // Get account info
      const accountInfo = await client.getAccountInfo();
      console.log(`Account type: ${accountInfo.accountType}, Permissions: ${accountInfo.permissions.join(', ')}`);
      
      // Get balances
      const balances = await client.getBalances();
      console.log(`Found ${balances.length} balances`);
      
      // Get recent trades (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const trades = await client.getTrades(undefined, oneWeekAgo, new Date());
      console.log(`Found ${trades.length} recent trades`);
      
      // Process balances as current positions
      await processBalancesAsPositions(apiKey, exchange, balances);
      
      // Process trades as transactions
      await processTradesAsTransactions(apiKey, exchange, trades);
      
    } catch (error) {
      console.error(`Failed to sync ${exchange.name}:`, error);
      throw error;
    }
  }

/**
 * Sync decentralized exchange (Uniswap, etc.)
 */
async function syncDecentralizedExchange(apiKey: any, exchange: any): Promise<void> {
  console.log(`Syncing DEX: ${exchange.name} (${exchange.code})`);
  
  // TODO: Implement DEX integration using wallet addresses
  // This would involve:
  // 1. Get wallet address from API key or user account
  // 2. Query blockchain for token balances
  // 3. Query DEX history from subgraph or blockchain
  // 4. Map to internal transactions
  
  // For now, just simulate sync
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Sync wallet (MetaMask, etc.)
 */
async function syncWallet(apiKey: any, exchange: any): Promise<void> {
  console.log(`Syncing wallet: ${exchange.name} (${exchange.code})`);
  
  // Wallets are typically manual or read via blockchain
  // For manual wallets, users add transactions manually
  // For automated wallet sync, would need wallet address
  
  if (exchange.code === 'METAMASK') {
    // TODO: Implement MetaMask wallet sync via blockchain RPC
    console.log('MetaMask wallet sync would be implemented here');
  } else if (exchange.code === 'MANUAL') {
    // Manual wallet - no automatic sync
    console.log('Manual wallet - no automatic sync required');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Sync broker (Interactive Brokers, etc.)
 */
async function syncBroker(apiKey: any, exchange: any): Promise<void> {
  console.log(`Syncing broker: ${exchange.name} (${exchange.code})`);
  
  // TODO: Implement broker API integration
  // Brokers typically have REST APIs for account info and trades
  
  if (exchange.code === 'IBKR') {
    console.log('Interactive Brokers sync would be implemented here');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Process exchange balances as portfolio positions
 */
async function processBalancesAsPositions(apiKey: any, exchange: any, balances: any[]): Promise<void> {
  const { userId } = apiKey;
  
  // Get user's default portfolio
  const defaultPortfolio = await prisma.portfolio.findFirst({
    where: { 
      userId, 
      isDefault: true 
    },
  });
  
  if (!defaultPortfolio) {
    console.error(`No default portfolio found for user ${userId}`);
    return;
  }
  
  // Get user's default account for this exchange
  const userAccount = await prisma.userAccount.findFirst({
    where: {
      userId,
      exchangeId: exchange.id,
      isDefault: true,
    },
  });
  
  if (!userAccount) {
    console.error(`No default account found for exchange ${exchange.name} for user ${userId}`);
    return;
  }
  
  for (const balance of balances) {
    try {
      // Skip zero balances
      if (balance.total <= 0) continue;
      
      // Map exchange asset symbol to internal asset
      const assetId = await mapExternalSymbolToAsset(balance.asset, exchange.code);
      
      if (!assetId) {
        console.warn(`Could not map exchange asset ${balance.asset} to internal asset`);
        continue;
      }
      
      // Check if position already exists
      const existingPosition = await prisma.position.findFirst({
        where: {
          portfolioId: defaultPortfolio.id,
          assetId,
          userAccountId: userAccount.id,
        },
      });
      
      if (existingPosition) {
        // Update existing position quantity
        // Note: For exchange sync, we replace the quantity with current balance
        // This assumes the exchange is the source of truth
        await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: new Prisma.Decimal(balance.total),
            // Keep existing cost basis (we don't know purchase price from balance alone)
          },
        });
        
        console.log(`Updated position for ${balance.asset}: ${balance.total}`);
      } else {
        // Create new position with zero cost basis (unknown)
        // User should manually adjust cost basis or it will be updated from trade history
        await prisma.position.create({
          data: {
            portfolioId: defaultPortfolio.id,
            assetId,
            userAccountId: userAccount.id,
            quantity: new Prisma.Decimal(balance.total),
            avgPrice: new Prisma.Decimal(0), // Unknown from balance alone
            costBasis: new Prisma.Decimal(0), // Will be updated from trades
            realizedPnl: new Prisma.Decimal(0),
            unrealizedPnl: new Prisma.Decimal(0),
          },
        });
        
        console.log(`Created position for ${balance.asset}: ${balance.total}`);
      }
    } catch (error) {
      console.error(`Failed to process balance for ${balance.asset}:`, error);
    }
  }
}

/**
 * Process exchange trades as transactions
 */
async function processTradesAsTransactions(apiKey: any, exchange: any, trades: any[]): Promise<void> {
  const { userId } = apiKey;
  
  // Get user's default portfolio
  const defaultPortfolio = await prisma.portfolio.findFirst({
    where: { 
      userId, 
      isDefault: true 
    },
  });
  
  if (!defaultPortfolio) {
    console.error(`No default portfolio found for user ${userId}`);
    return;
  }
  
  // Get user's default account for this exchange
  const userAccount = await prisma.userAccount.findFirst({
    where: {
      userId,
      exchangeId: exchange.id,
      isDefault: true,
    },
  });
  
  if (!userAccount) {
    console.error(`No default account found for exchange ${exchange.name} for user ${userId}`);
    return;
  }
  
  for (const trade of trades) {
    try {
      // Add exchange information to trade object
      const enhancedTrade = {
        ...trade,
        exchangeId: exchange.id,
        exchangeCode: exchange.code,
      };
      
      await createTransactionFromExternalTrade(
        userId,
        defaultPortfolio.id,
        userAccount.id,
        enhancedTrade
      );
    } catch (error) {
      console.error(`Failed to process trade ${trade.id}:`, error);
    }
  }
}

/**
 * Map external symbol to internal asset
 */
async function mapExternalSymbolToAsset(externalSymbol: string, exchangeCode: string): Promise<bigint | null> {
  // Try different symbol formats
  const symbolVariations = [externalSymbol];
  
  // OKX uses BTC-USDT format, convert to BTCUSDT
  if (exchangeCode === 'OKX' && externalSymbol.includes('-')) {
    symbolVariations.push(externalSymbol.replace('-', ''));
  }
  
  // Binance uses BTCUSDT format (no dash)
  if (exchangeCode === 'BINANCE' && !externalSymbol.includes('-')) {
    // Try to extract base and quote
    const commonQuotes = ['USDT', 'BTC', 'ETH', 'BNB', 'USD', 'EUR'];
    for (const quote of commonQuotes) {
      if (externalSymbol.endsWith(quote)) {
        const base = externalSymbol.slice(0, -quote.length);
        symbolVariations.push(`${base}-${quote}`); // Add dashed version
        break;
      }
    }
  }
  
  // Try to find asset by symbol variations
  for (const symbol of symbolVariations) {
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { symbol: symbol },
          { externalSymbol: symbol },
        ],
      },
    });
    
    if (asset) {
      return asset.id;
    }
  }
  
  // If asset not found, try to create it based on symbol pattern
  console.warn(`Asset not found for symbol ${externalSymbol} (exchange: ${exchangeCode}), attempting to create...`);
  
  // Try to parse symbol
  let baseAsset = externalSymbol;
  let quoteAsset = 'USDT'; // Default
  
  if (exchangeCode === 'OKX' && externalSymbol.includes('-')) {
    const parts = externalSymbol.split('-');
    if (parts.length === 2) {
      baseAsset = parts[0];
      quoteAsset = parts[1];
    }
  } else {
    // Try common quote currencies
    const commonQuotes = ['USDT', 'BTC', 'ETH', 'BNB', 'USD', 'EUR', 'OKB'];
    for (const quote of commonQuotes) {
      if (externalSymbol.endsWith(quote)) {
        baseAsset = externalSymbol.slice(0, -quote.length);
        quoteAsset = quote;
        break;
      }
    }
  }
  
  // Create new asset
  try {
    const newAsset = await prisma.asset.create({
      data: {
        symbol: externalSymbol.includes('-') ? externalSymbol.replace('-', '') : externalSymbol,
        externalSymbol: externalSymbol,
        name: `${baseAsset}/${quoteAsset}`,
        assetType: 'CRYPTO', // Default, could be determined better
        quoteCurrency: quoteAsset,
        precision: 8, // Default
        isActive: true,
      },
    });
    
    console.log(`Created new asset: ${newAsset.symbol} (${newAsset.name})`);
    return newAsset.id;
  } catch (error) {
    console.error(`Failed to create asset for ${externalSymbol}:`, error);
    return null;
  }
}

/**
 * Create transaction from external trade
 */
async function createTransactionFromExternalTrade(
  userId: bigint,
  portfolioId: bigint,
  userAccountId: bigint,
  externalTrade: any
): Promise<void> {
  // Check if transaction already exists
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      tradeIdExternal: externalTrade.id,
      userAccountId: userAccountId,
    },
  });
  
  if (existingTransaction) {
    // Transaction already processed
    return;
  }
  
  // Map trade symbol to asset
  const assetId = await mapExternalSymbolToAsset(externalTrade.symbol, externalTrade.exchangeCode || 'UNKNOWN');
  
  if (!assetId) {
    throw new Error(`Could not map trade symbol ${externalTrade.symbol} to asset`);
  }
  
  // Determine transaction side
  const side = externalTrade.side === 'BUY' ? TransactionSide.BUY : TransactionSide.SELL;
  
  // Calculate gross amount
  const grossAmount = new Prisma.Decimal(externalTrade.quantity).mul(new Prisma.Decimal(externalTrade.price));
  
  // Create transaction
  await prisma.transaction.create({
    data: {
      portfolioId,
      userAccountId,
      assetId,
      side,
      quantity: new Prisma.Decimal(externalTrade.quantity),
      price: new Prisma.Decimal(externalTrade.price),
      grossAmount,
      feeAmount: new Prisma.Decimal(externalTrade.fee || 0),
      feeCurrency: externalTrade.feeCurrency || 'USDT',
      transactionCurrency: externalTrade.feeCurrency || 'USDT',
      tradeTime: externalTrade.timestamp,
      tradeIdExternal: externalTrade.id,
      note: `Imported from ${externalTrade.exchangeCode || 'exchange'} sync`,
    },
  });
  
  console.log(`Created transaction for trade ${externalTrade.id}: ${externalTrade.side} ${externalTrade.quantity} @ ${externalTrade.price}`);
  
  // Note: Position update is handled automatically by the TransactionService
  // via database triggers or application logic
}

/**
 * Schedule exchange sync jobs
 */
export function scheduleExchangeSync(): void {
  // Every 15 minutes: "*/15 * * * *"
  cron.schedule('*/15 * * * *', async () => {
    console.log('Scheduling exchange sync job...');
    await exchangeSyncQueue.add('sync-all-exchanges', {}, {
      jobId: `exchange-sync-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  // Daily at 2 AM: "0 2 * * *" - for full historical sync
  cron.schedule('0 2 * * *', async () => {
    console.log('Scheduling full historical sync job...');
    await exchangeSyncQueue.add('historical-sync', { fullHistory: true }, {
      jobId: `historical-sync-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
  
  console.log('Exchange sync scheduler started (every 15 minutes, historical daily at 2 AM)');
}

/**
 * Initialize exchange sync jobs
 */
export function initializeExchangeSyncJobs(): void {
  scheduleExchangeSync();
  
  // Listen for worker events
  exchangeSyncWorker.on('completed', (job) => {
    console.log(`Exchange sync job ${job.id} completed`);
  });
  
  exchangeSyncWorker.on('failed', (job, err) => {
    console.error(`Exchange sync job ${job?.id} failed:`, err);
  });
  
  console.log('Exchange sync jobs initialized');
}
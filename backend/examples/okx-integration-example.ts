/**
 * Example: How to use OKX API integration in Crypto Portfolio Tracker
 * 
 * This example demonstrates:
 * 1. Testing OKX connection
 * 2. Adding OKX API keys to user account
 * 3. Manually triggering sync
 * 4. Checking sync results
 */

import { ExchangeClientFactory } from '../src/modules/exchanges/exchange-client.factory';
import { encryptionService } from '../src/common/utils/encryption';
import { prisma } from '../src/config/db';

async function okxIntegrationExample() {
  console.log('=== OKX Integration Example ===\n');
  
  // IMPORTANT: Replace with your actual OKX API keys (read-only keys only!)
  // Generate these in OKX dashboard with READ-ONLY permissions
  const okxApiKey = process.env.OKX_API_KEY || 'your-okx-api-key';
  const okxApiSecret = process.env.OKX_API_SECRET || 'your-okx-api-secret';
  const okxPassphrase = process.env.OKX_PASSPHRASE || 'your-okx-passphrase';
  const isTestnet = process.env.OKX_TESTNET === 'true';
  
  const userId = 1n; // Replace with actual user ID
  const exchangeCode = 'OKX';
  
  // -----------------------------------------------------------------
  // 1. Test OKX Connection
  // -----------------------------------------------------------------
  console.log('1. Testing OKX connection...');
  
  try {
    const isConnected = await ExchangeClientFactory.testConnection(
      exchangeCode,
      okxApiKey,
      okxApiSecret,
      okxPassphrase
    );
    
    if (isConnected) {
      console.log('✅ OKX connection test successful!\n');
    } else {
      console.log('❌ OKX connection test failed. Check your API keys.\n');
      return;
    }
  } catch (error) {
    console.error('❌ Error testing OKX connection:', error);
    return;
  }
  
  // -----------------------------------------------------------------
  // 2. Get OKX Exchange from Database (ensure it exists)
  // -----------------------------------------------------------------
  console.log('2. Getting OKX exchange from database...');
  
  let okxExchange = await prisma.exchange.findFirst({
    where: { code: exchangeCode },
  });
  
  if (!okxExchange) {
    console.log('OKX exchange not found in database. Creating...');
    
    // Create OKX exchange if not seeded
    okxExchange = await prisma.exchange.create({
      data: {
        name: 'OKX',
        code: 'OKX',
        type: 'CEX',
        websiteUrl: 'https://okx.com',
      },
    });
    
    console.log(`✅ Created OKX exchange with ID: ${okxExchange.id}\n`);
  } else {
    console.log(`✅ Found OKX exchange with ID: ${okxExchange.id}\n`);
  }
  
  // -----------------------------------------------------------------
  // 3. Create User Account for OKX
  // -----------------------------------------------------------------
  console.log('3. Creating user account for OKX...');
  
  let userAccount = await prisma.userAccount.findFirst({
    where: {
      userId,
      exchangeId: okxExchange.id,
      isDefault: true,
    },
  });
  
  if (!userAccount) {
    userAccount = await prisma.userAccount.create({
      data: {
        userId,
        exchangeId: okxExchange.id,
        name: 'OKX Main Account',
        accountType: 'SPOT',
        baseCurrency: 'USD',
        isDefault: true,
      },
    });
    
    console.log(`✅ Created user account with ID: ${userAccount.id}\n`);
  } else {
    console.log(`✅ Found existing user account with ID: ${userAccount.id}\n`);
  }
  
  // -----------------------------------------------------------------
  // 4. Store API Keys Securely (Encrypted)
  // -----------------------------------------------------------------
  console.log('4. Storing OKX API keys (encrypted)...');
  
  // Encrypt API keys before storing
  const encryptedApiKey = encryptionService.encrypt(okxApiKey);
  const encryptedApiSecret = encryptionService.encrypt(okxApiSecret);
  const encryptedPassphrase = okxPassphrase 
    ? encryptionService.encrypt(okxPassphrase)
    : null;
  
  // Check if API key already exists
  const existingApiKey = await prisma.userApiKey.findFirst({
    where: {
      userId,
      exchangeId: okxExchange.id,
      isActive: true,
    },
  });
  
  if (existingApiKey) {
    console.log('⚠️  Active API key already exists. Updating...');
    
    await prisma.userApiKey.update({
      where: { id: existingApiKey.id },
      data: {
        apiKeyEncrypted: encryptedApiKey,
        apiSecretEncrypted: encryptedApiSecret,
        passphraseEncrypted: encryptedPassphrase,
        updatedAt: new Date(),
      },
    });
    
    console.log(`✅ Updated existing API key record (ID: ${existingApiKey.id})\n`);
  } else {
    const newApiKey = await prisma.userApiKey.create({
      data: {
        userId,
        exchangeId: okxExchange.id,
        label: 'OKX Read-Only Key',
        apiKeyEncrypted: encryptedApiKey,
        apiSecretEncrypted: encryptedApiSecret,
        passphraseEncrypted: encryptedPassphrase,
        isReadOnly: true,
        isActive: true,
      },
    });
    
    console.log(`✅ Created new API key record (ID: ${newApiKey.id})\n`);
  }
  
  // -----------------------------------------------------------------
  // 5. Create OKX Client and Fetch Data
  // -----------------------------------------------------------------
  console.log('5. Creating OKX client and fetching data...');
  
  try {
    // Create OKX client
    const okxClient = ExchangeClientFactory.createClient(
      exchangeCode,
      okxApiKey,
      okxApiSecret,
      okxPassphrase,
      isTestnet
    );
    
    // Get account info
    console.log('   Fetching account info...');
    const accountInfo = await okxClient.getAccountInfo();
    console.log(`   Account Type: ${accountInfo.accountType}`);
    console.log(`   Permissions: ${accountInfo.permissions.join(', ')}`);
    console.log(`   Can Trade: ${accountInfo.canTrade}`);
    
    // Get balances
    console.log('\n   Fetching balances...');
    const balances = await okxClient.getBalances();
    console.log(`   Found ${balances.length} balances:`);
    
    balances.forEach((balance, index) => {
      if (balance.total > 0) {
        console.log(`     ${index + 1}. ${balance.asset}: ${balance.total} (Free: ${balance.free}, Locked: ${balance.locked})`);
      }
    });
    
    // Get recent trades (last 7 days)
    console.log('\n   Fetching recent trades...');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const trades = await okxClient.getTrades(undefined, oneWeekAgo, new Date());
    console.log(`   Found ${trades.length} trades in the last 7 days:`);
    
    trades.slice(0, 5).forEach((trade, index) => {
      console.log(`     ${index + 1}. ${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price}`);
    });
    
    if (trades.length > 5) {
      console.log(`     ... and ${trades.length - 5} more trades`);
    }
    
    console.log('\n✅ OKX data fetch successful!\n');
    
  } catch (error) {
    console.error('❌ Error fetching OKX data:', error);
    return;
  }
  
  // -----------------------------------------------------------------
  // 6. Manual Sync (Alternative to Scheduled Job)
  // -----------------------------------------------------------------
  console.log('6. Instructions for manual sync:');
  console.log(`
   The system automatically syncs exchange data every 15 minutes via scheduled jobs.
   
   To trigger manual sync:
   
   Option A: Via API (if endpoint exists):
     POST /api/exchanges/sync/{exchangeId}
   
   Option B: Programmatically:
     import { exchangeSyncQueue } from '../src/infrastructure/jobs/exchange-sync.job';
     
     // Sync all exchanges
     await exchangeSyncQueue.add('sync-all-exchanges', {});
     
     // Or sync specific user's exchange
     await exchangeSyncQueue.add('sync-user-exchange', {
       userId: ${userId},
       exchangeId: ${okxExchange.id},
     });
   
   Option C: Direct function call:
     import { syncUserExchangeAccount } from '../src/infrastructure/jobs/exchange-sync.job';
     
     // Get API key ID
     const apiKey = await prisma.userApiKey.findFirst({
       where: {
         userId: ${userId},
         exchangeId: ${okxExchange.id},
         isActive: true,
       },
     });
     
     if (apiKey) {
       await syncUserExchangeAccount(${userId}, ${okxExchange.id}, apiKey.id);
     }
  `);
  
  // -----------------------------------------------------------------
  // 7. Check Sync Results
  // -----------------------------------------------------------------
  console.log('\n7. Checking sync results in database:');
  
  // Check positions in default portfolio
  const defaultPortfolio = await prisma.portfolio.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    include: {
      positions: {
        include: {
          asset: true,
          userAccount: true,
        },
      },
    },
  });
  
  if (defaultPortfolio) {
    console.log(`   Default Portfolio: ${defaultPortfolio.name} (ID: ${defaultPortfolio.id})`);
    console.log(`   Positions count: ${defaultPortfolio.positions.length}`);
    
    defaultPortfolio.positions.forEach((position, index) => {
      if (position.userAccount?.exchangeId === okxExchange.id) {
        console.log(`     ${index + 1}. ${position.asset.symbol}: ${position.quantity} (Avg Price: ${position.avgPrice})`);
      }
    });
  }
  
  // Check transactions
  const okxTransactions = await prisma.transaction.findMany({
    where: {
      userAccountId: userAccount.id,
    },
    include: {
      asset: true,
    },
    orderBy: {
      tradeTime: 'desc',
    },
    take: 5,
  });
  
  console.log(`\n   Recent transactions from OKX: ${okxTransactions.length} found`);
  
  okxTransactions.forEach((tx, index) => {
    console.log(`     ${index + 1}. ${tx.side} ${tx.quantity} ${tx.asset.symbol} @ ${tx.price} (${tx.tradeTime.toLocaleDateString()})`);
  });
  
  console.log('\n=== OKX Integration Example Complete ===');
  console.log('\nNext steps:');
  console.log('1. Run scheduled sync jobs: npm run dev (jobs start automatically)');
  console.log('2. Check sync logs for any errors');
  console.log('3. Monitor positions and transactions in database');
  console.log('4. Set up alerts for your OKX holdings');
  
  await prisma.$disconnect();
}

// Run the example if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  okxIntegrationExample().catch((error) => {
    console.error('Unhandled error in OKX integration example:', error);
    process.exit(1);
  });
}

export { okxIntegrationExample };
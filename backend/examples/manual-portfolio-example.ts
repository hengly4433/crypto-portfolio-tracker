/**
 * Example: Using Crypto Portfolio Tracker WITHOUT Exchange Integration
 * 
 * This demonstrates how to use the system as a pure manual portfolio tracker
 * with NO external dependencies (no OKX, no Binance, no Redis, no price APIs).
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

async function manualPortfolioExample() {
  console.log('=== Manual Portfolio Tracking Example ===\n');
  console.log('This example shows how to use the system WITHOUT any exchange integration.\n');
  
  const prisma = new PrismaClient();
  
  try {
    // -----------------------------------------------------------------
    // 1. Create a User (Simulating Registration)
    // -----------------------------------------------------------------
    console.log('1. Creating user (simulating registration)...');
    
    const email = `manual-user-${Date.now()}@example.com`;
    const password = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'Manual Trader',
        country: 'US',
      },
    });
    
    console.log(`✅ Created user: ${user.email} (ID: ${user.id})\n`);
    
    // -----------------------------------------------------------------
    // 2. User Gets Default Portfolio & Manual Account (Auto-created)
    // -----------------------------------------------------------------
    console.log('2. Checking auto-created portfolio and manual account...');
    
    // These are created automatically by the AuthService.register()
    // For this example, we'll create them manually
    
    // Create user settings
    const userSettings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        baseCurrency: 'USD',
        timezone: 'UTC',
        locale: 'en-US',
        darkMode: false,
      },
    });
    
    console.log(`✅ User settings created (base currency: ${userSettings.baseCurrency})`);
    
    // Get or create MANUAL exchange
    let manualExchange = await prisma.exchange.findFirst({
      where: { code: 'MANUAL' },
    });
    
    if (!manualExchange) {
      manualExchange = await prisma.exchange.create({
        data: {
          name: 'Manual',
          code: 'MANUAL',
          type: 'WALLET',
        },
      });
    }
    
    // Create manual user account
    const manualAccount = await prisma.userAccount.create({
      data: {
        userId: user.id,
        exchangeId: manualExchange.id,
        name: 'Manual Wallet',
        accountType: 'WALLET',
        baseCurrency: 'USD',
        isDefault: true,
      },
    });
    
    console.log(`✅ Manual account created: ${manualAccount.name} (ID: ${manualAccount.id})`);
    
    // Create default portfolio
    const defaultPortfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'My Portfolio',
        baseCurrency: 'USD',
        isDefault: true,
      },
    });
    
    console.log(`✅ Default portfolio created: ${defaultPortfolio.name} (ID: ${defaultPortfolio.id})\n`);
    
    // -----------------------------------------------------------------
    // 3. Get or Create Assets (BTC, ETH, etc.)
    // -----------------------------------------------------------------
    console.log('3. Setting up assets for manual tracking...');
    
    // Get existing assets or create them
    const assetSymbols = ['BTC', 'ETH', 'SOL', 'USDT'];
    const assets: Record<string, any> = {};
    
    for (const symbol of assetSymbols) {
      let asset = await prisma.asset.findFirst({
        where: { symbol },
      });
      
      if (!asset) {
        asset = await prisma.asset.create({
          data: {
            symbol,
            name: symbol === 'BTC' ? 'Bitcoin' : 
                  symbol === 'ETH' ? 'Ethereum' : 
                  symbol === 'SOL' ? 'Solana' : 'Tether',
            assetType: 'CRYPTO',
            quoteCurrency: 'USDT',
            precision: 8,
            isActive: true,
          },
        });
        console.log(`   Created asset: ${asset.symbol} - ${asset.name}`);
      } else {
        console.log(`   Found asset: ${asset.symbol} - ${asset.name}`);
      }
      
      assets[symbol] = asset;
    }
    
    console.log('');
    
    // -----------------------------------------------------------------
    // 4. Add Manual Transactions (Core Functionality)
    // -----------------------------------------------------------------
    console.log('4. Adding manual transactions (core portfolio tracking)...');
    
    const transactions = [
      {
        symbol: 'BTC',
        side: 'BUY' as const,
        quantity: 0.5,
        price: 45000,
        date: new Date('2024-01-15'),
        note: 'Initial purchase',
      },
      {
        symbol: 'ETH',
        side: 'BUY' as const,
        quantity: 3.2,
        price: 3000,
        date: new Date('2024-02-01'),
        note: 'DCA buy',
      },
      {
        symbol: 'SOL',
        side: 'BUY' as const,
        quantity: 10,
        price: 150,
        date: new Date('2024-02-15'),
        note: 'Solana investment',
      },
      {
        symbol: 'ETH',
        side: 'SELL' as const,
        quantity: 1.0,
        price: 3500,
        date: new Date('2024-03-10'),
        note: 'Partial profit taking',
      },
      {
        symbol: 'BTC',
        side: 'BUY' as const,
        quantity: 0.1,
        price: 52000,
        date: new Date('2024-03-20'),
        note: 'Additional purchase',
      },
    ];
    
    for (const tx of transactions) {
      const asset = assets[tx.symbol];
      const grossAmount = tx.quantity * tx.price;
      
      await prisma.transaction.create({
        data: {
          portfolioId: defaultPortfolio.id,
          userAccountId: manualAccount.id,
          assetId: asset.id,
          side: tx.side,
          quantity: tx.quantity,
          price: tx.price,
          grossAmount,
          transactionCurrency: 'USD',
          tradeTime: tx.date,
          note: tx.note,
        },
      });
      
      console.log(`   ${tx.side} ${tx.quantity} ${tx.symbol} @ $${tx.price} (${tx.date.toLocaleDateString()})`);
    }
    
    console.log('');
    
    // -----------------------------------------------------------------
    // 5. Check Positions (Auto-calculated from Transactions)
    // -----------------------------------------------------------------
    console.log('5. Checking positions (auto-calculated from transactions)...');
    
    const positions = await prisma.position.findMany({
      where: {
        portfolioId: defaultPortfolio.id,
      },
      include: {
        asset: true,
      },
    });
    
    console.log(`   Found ${positions.length} positions:`);
    for (const position of positions) {
      console.log(`   - ${position.asset.symbol}: ${position.quantity} (Avg Price: $${position.avgPrice})`);
    }
    
    console.log('');
    
    // -----------------------------------------------------------------
    // 6. Create Manual Price Entries (Alternative to API)
    // -----------------------------------------------------------------
    console.log('6. Setting manual prices (alternative to API price updates)...');
    
    const manualPrices = [
      { symbol: 'BTC', price: 51000 },
      { symbol: 'ETH', price: 3200 },
      { symbol: 'SOL', price: 180 },
      { symbol: 'USDT', price: 1 },
    ];
    
    for (const mp of manualPrices) {
      const asset = assets[mp.symbol];
      
      await prisma.priceSpot.create({
        data: {
          assetId: asset.id,
          quoteCurrency: 'USD',
          price: mp.price,
          source: 'MANUAL',
          fetchedAt: new Date(),
        },
      });
      
      console.log(`   Set ${mp.symbol} price: $${mp.price}`);
    }
    
    console.log('');
    
    // -----------------------------------------------------------------
    // 7. Create Alerts (Will check against manual prices)
    // -----------------------------------------------------------------
    console.log('7. Creating price alerts (work with manual prices)...');
    
    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        assetId: assets['BTC'].id,
        alertType: 'PRICE_BELOW',
        conditionValue: 40000,
        isActive: true,
      },
    });
    
    console.log(`✅ Alert created: Notify if BTC drops below $40,000 (ID: ${alert.id})`);
    
    // -----------------------------------------------------------------
    // 8. Calculate Portfolio Value (Using Manual Prices)
    // -----------------------------------------------------------------
    console.log('\n8. Calculating portfolio value (using manual prices)...');
    
    let totalValue = 0;
    for (const position of positions) {
      const latestPrice = await prisma.priceSpot.findFirst({
        where: {
          assetId: position.assetId,
          quoteCurrency: 'USD',
        },
        orderBy: {
          fetchedAt: 'desc',
        },
      });
      
      if (latestPrice) {
        const value = position.quantity * latestPrice.price.toNumber();
        totalValue += value;
        console.log(`   ${position.asset.symbol}: ${position.quantity} × $${latestPrice.price} = $${value.toFixed(2)}`);
      }
    }
    
    console.log(`\n   📊 TOTAL PORTFOLIO VALUE: $${totalValue.toFixed(2)}`);
    
    // -----------------------------------------------------------------
    // 9. Create Portfolio Snapshot (Manual)
    // -----------------------------------------------------------------
    console.log('\n9. Creating portfolio snapshot (manual version)...');
    
    await prisma.portfolioSnapshot.create({
      data: {
        portfolioId: defaultPortfolio.id,
        totalValue: totalValue,
        totalUnrealizedPnl: 0, // Would need cost basis calculation
        totalRealizedPnl: 0,
      },
    });
    
    console.log('✅ Portfolio snapshot created');
    
    // -----------------------------------------------------------------
    // 10. Summary & API Usage
    // -----------------------------------------------------------------
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MANUAL PORTFOLIO TRACKING SETUP COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n📋 What you can do WITHOUT any external services:');
    console.log('✅ Track multiple assets (BTC, ETH, SOL, etc.)');
    console.log('✅ Record BUY/SELL transactions with dates/prices');
    console.log('✅ Auto-calculate positions from transactions');
    console.log('✅ Set manual prices for valuation');
    console.log('✅ Create price alerts (check manually)');
    console.log('✅ Calculate portfolio value');
    console.log('✅ Create performance snapshots');
    
    console.log('\n🔧 Missing (but optional):');
    console.log('❌ Automatic price updates (use manual prices)');
    console.log('❌ Automatic exchange sync (manual entry only)');
    console.log('❌ Background job processing (direct API calls)');
    console.log('❌ Real-time notifications (check manually)');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Use the API endpoints to manage your portfolio');
    console.log('2. Update prices manually when markets move');
    console.log('3. Add more transactions as you trade');
    console.log('4. Export data for tax reporting');
    
    console.log('\n📊 Sample API Calls:');
    console.log(`
# Get portfolio positions
curl -X GET "http://localhost:3001/api/portfolios/${defaultPortfolio.id}/positions" \\
  -H "Authorization: Bearer <your-jwt-token>"

# Add new transaction
curl -X POST "http://localhost:3001/api/portfolios/${defaultPortfolio.id}/transactions" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetId": "${assets['BTC'].id}",
    "side": "BUY",
    "quantity": 0.05,
    "price": 50000,
    "transactionCurrency": "USD",
    "date": "${new Date().toISOString()}"
  }'

# Update manual price
curl -X POST "http://localhost:3001/api/prices/manual" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetSymbol": "BTC",
    "price": 52000,
    "quoteCurrency": "USD"
  }'
    `);
    
  } catch (error) {
    console.error('Error in manual portfolio example:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the example
if (require.main === module) {
  manualPortfolioExample().catch(console.error);
}

export { manualPortfolioExample };
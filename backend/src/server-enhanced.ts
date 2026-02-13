import 'dotenv/config';
import app from './app';
import { prisma } from './config/db';
import { FEATURES, applyPreset, getConfigSummary, CONFIG_PRESETS } from './config/features';
import { initializeAllJobs } from './infrastructure/jobs/job-manager-featured';

const PORT = process.env.PORT || 3001;

/**
 * Check for required services and provide helpful error messages
 */
async function checkDependencies() {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check database connection
  try {
    await prisma.$connect();
    console.log('✅ Database: Connected');
  } catch (error) {
    issues.push(`Database connection failed: ${(error as Error).message}`);
  }
  
  // Check Redis if required
  if (FEATURES.ENABLE_BACKGROUND_JOBS) {
    try {
      // Simple Redis check - would need actual Redis client
      console.log('⚠️  Redis: Background jobs enabled (assuming Redis is available)');
      warnings.push('Redis is required for background jobs. Ensure redis-server is running.');
    } catch (error) {
      issues.push(`Redis connection failed: ${(error as Error).message}`);
    }
  } else {
    console.log('✅ Redis: Not required (background jobs disabled)');
  }
  
  // Check price APIs if required
  if (FEATURES.ENABLE_PRICE_APIS) {
    if (!process.env.COINGECKO_API_KEY && !process.env.ALPHA_VANTAGE_API_KEY) {
      warnings.push('Price APIs enabled but no API keys found. Set COINGECKO_API_KEY and/or ALPHA_VANTAGE_API_KEY.');
    }
    console.log('⚠️  Price APIs: Enabled (checking for API keys...)');
  } else {
    console.log('✅ Price APIs: Not required (manual mode)');
  }
  
  // Check exchange APIs if required
  if (FEATURES.ENABLE_EXCHANGE_SYNC) {
    console.log('⚠️  Exchange APIs: Enabled (requires API keys for exchanges)');
    warnings.push('Exchange sync enabled. Add OKX/Binance API keys to sync.');
  } else {
    console.log('✅ Exchange APIs: Not required (manual mode)');
  }
  
  return { issues, warnings };
}

/**
 * Display startup banner with configuration
 */
function displayStartupBanner() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Crypto Portfolio Tracker');
  console.log('='.repeat(60));
  
  const config = getConfigSummary();
  console.log(`Mode: ${config.mode}`);
  console.log(`Port: ${PORT}`);
  
  console.log('\n📊 Features:');
  console.log(`  • Background Jobs: ${FEATURES.ENABLE_BACKGROUND_JOBS ? '✅' : '❌'}`);
  console.log(`  • Price APIs: ${FEATURES.ENABLE_PRICE_APIS ? '✅' : '❌'}`);
  console.log(`  • Exchange Sync: ${FEATURES.ENABLE_EXCHANGE_SYNC ? '✅' : '❌'}`);
  console.log(`  • Candle Charts: ${FEATURES.ENABLE_CANDLE_AGGREGATION ? '✅' : '❌'}`);
  console.log(`  • Email Notifications: ${FEATURES.ENABLE_EMAIL_NOTIFICATIONS ? '✅' : '❌'}`);
  console.log(`  • Telegram Notifications: ${FEATURES.ENABLE_TELEGRAM_NOTIFICATIONS ? '✅' : '❌'}`);
  console.log(`  • Audit Logging: ${FEATURES.ENABLE_AUDIT_LOGGING ? '✅' : '❌'}`);
  
  console.log('\n🔧 Requirements:');
  console.log(`  • Redis: ${config.requirements.redis ? 'Required' : 'Optional'}`);
  console.log(`  • Price APIs: ${config.requirements.priceApis ? 'Required' : 'Optional'}`);
  console.log(`  • Exchange APIs: ${config.requirements.exchangeApis ? 'Required' : 'Optional'}`);
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  try {
    // Apply configuration preset from environment
    const preset = (process.env.CONFIG_PRESET as keyof typeof CONFIG_PRESETS) || 'DEVELOPMENT';
    if (process.env.CONFIG_PRESET) {
      applyPreset(preset);
    }
    
    // Display startup information
    displayStartupBanner();
    
    // Check dependencies
    console.log('🔍 Checking dependencies...');
    const { issues, warnings } = await checkDependencies();
    
    // Show warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    // Check for critical issues
    if (issues.length > 0) {
      console.log('\n❌ Critical issues found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      console.log('\n💡 Suggestions:');
      console.log('   1. Set CONFIG_PRESET=MANUAL to run without external services');
      console.log('   2. Check your .env file configuration');
      console.log('   3. Ensure required services are running');
      throw new Error('Dependency check failed');
    }
    
    // Initialize scheduled jobs (with error handling)
    console.log('\n⚙️  Initializing jobs...');
    try {
      initializeAllJobs();
    } catch (jobError) {
      console.warn(`Job initialization warning: ${(jobError as Error).message}`);
      console.log('Continuing without background jobs...');
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on http://localhost:${PORT}`);
      console.log('\n📚 Available endpoints:');
      console.log('   • POST /api/auth/register - Create account');
      console.log('   • POST /api/auth/login - Get JWT token');
      console.log('   • GET /api/portfolios - List portfolios');
      console.log('   • POST /api/portfolios - Create portfolio');
      console.log('   • POST /api/portfolios/:id/transactions - Add manual transaction');
      console.log('   • GET /api/portfolios/:id/positions - View positions');
      
      if (!FEATURES.ENABLE_BACKGROUND_JOBS) {
        console.log('\n💡 Manual Mode Active:');
        console.log('   • Update prices via POST /api/prices/manual');
        console.log('   • Check alerts manually');
        console.log('   • Add transactions manually');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('✨ Ready to track your portfolio!');
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start server:', (error as Error).message);
    
    // Provide helpful suggestions based on error
    if ((error as Error).message.includes('Database')) {
      console.log('\n💡 Database troubleshooting:');
      console.log('   1. Check DATABASE_URL in .env file');
      console.log('   2. Ensure PostgreSQL is running: `pg_isready`');
      console.log('   3. Create database: `createdb crypto_portfolio_tracker`');
    }
    
    if ((error as Error).message.includes('Redis')) {
      console.log('\n💡 Redis troubleshooting:');
      console.log('   1. Install Redis: `brew install redis` (macOS)');
      console.log('   2. Start Redis: `redis-server`');
      console.log('   3. Or disable Redis: Set ENABLE_BACKGROUND_JOBS=false');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
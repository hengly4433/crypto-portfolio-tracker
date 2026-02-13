/**
 * Feature flags for enabling/disabling system components
 * 
 * Use these flags to run the system without external dependencies:
 * - Set all to false for manual-only mode
 * - Enable progressively as you add services
 */

export const FEATURES = {
  /**
   * Enable Redis and background job processing
   * Required for: scheduled price updates, exchange sync, alert checking
   */
  ENABLE_BACKGROUND_JOBS: process.env.ENABLE_BACKGROUND_JOBS !== 'false',
  
  /**
   * Enable exchange integration (OKX, Binance, etc.)
   * Requires: API keys, Redis, and ENABLE_BACKGROUND_JOBS
   */
  ENABLE_EXCHANGE_SYNC: process.env.ENABLE_EXCHANGE_SYNC !== 'false',
  
  /**
   * Enable external price APIs (CoinGecko, Alpha Vantage)
   * Required for: automatic price updates, accurate portfolio valuation
   */
  ENABLE_PRICE_APIS: process.env.ENABLE_PRICE_APIS !== 'false',
  
  /**
   * Enable candle aggregation for charts
   * Requires: price data (ENABLE_PRICE_APIS or manual prices)
   */
  ENABLE_CANDLE_AGGREGATION: process.env.ENABLE_CANDLE_AGGREGATION !== 'false',
  
  /**
   * Enable email notifications
   * Requires: SMTP configuration
   */
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  
  /**
   * Enable Telegram notifications
   * Requires: Telegram bot token
   */
  ENABLE_TELEGRAM_NOTIFICATIONS: process.env.ENABLE_TELEGRAM_NOTIFICATIONS !== 'false',
  
  /**
   * Enable audit logging (always recommended)
   */
  ENABLE_AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING !== 'false',
};

/**
 * Configuration presets for different deployment scenarios
 */
export const CONFIG_PRESETS = {
  /**
   * Manual mode: No external dependencies
   * - Manual transactions only
   * - Manual price entry
   * - No background jobs
   */
  MANUAL: {
    ENABLE_BACKGROUND_JOBS: false,
    ENABLE_EXCHANGE_SYNC: false,
    ENABLE_PRICE_APIS: false,
    ENABLE_CANDLE_AGGREGATION: false,
    ENABLE_EMAIL_NOTIFICATIONS: false,
    ENABLE_TELEGRAM_NOTIFICATIONS: false,
    ENABLE_AUDIT_LOGGING: true,
  },
  
  /**
   * Development mode: Basic features only
   * - Manual transactions
   * - Auto prices (if API keys available)
   * - Local Redis for jobs
   */
  DEVELOPMENT: {
    ENABLE_BACKGROUND_JOBS: true,
    ENABLE_EXCHANGE_SYNC: false,
    ENABLE_PRICE_APIS: true,
    ENABLE_CANDLE_AGGREGATION: false,
    ENABLE_EMAIL_NOTIFICATIONS: false,
    ENABLE_TELEGRAM_NOTIFICATIONS: false,
    ENABLE_AUDIT_LOGGING: true,
  },
  
  /**
   * Production mode: All features
   * - Full exchange integration
   * - Auto prices
   * - All notifications
   */
  PRODUCTION: {
    ENABLE_BACKGROUND_JOBS: true,
    ENABLE_EXCHANGE_SYNC: true,
    ENABLE_PRICE_APIS: true,
    ENABLE_CANDLE_AGGREGATION: true,
    ENABLE_EMAIL_NOTIFICATIONS: true,
    ENABLE_TELEGRAM_NOTIFICATIONS: true,
    ENABLE_AUDIT_LOGGING: true,
  },
};

/**
 * Apply a configuration preset
 */
export function applyPreset(preset: keyof typeof CONFIG_PRESETS) {
  const presetConfig = CONFIG_PRESETS[preset];
  Object.assign(FEATURES, presetConfig);
  console.log(`Applied configuration preset: ${preset}`);
}

/**
 * Check if Redis is required based on enabled features
 */
export function isRedisRequired(): boolean {
  return FEATURES.ENABLE_BACKGROUND_JOBS;
}

/**
 * Check if external price APIs are required
 */
export function arePriceApisRequired(): boolean {
  return FEATURES.ENABLE_PRICE_APIS;
}

/**
 * Check if exchange APIs are required
 */
export function areExchangeApisRequired(): boolean {
  return FEATURES.ENABLE_EXCHANGE_SYNC;
}

/**
 * Get current configuration summary
 */
export function getConfigSummary() {
  return {
    mode: Object.entries(CONFIG_PRESETS).find(([_, preset]) => 
      Object.keys(preset).every(key => 
        FEATURES[key as keyof typeof FEATURES] === preset[key as keyof typeof preset]
      )
    )?.[0] || 'CUSTOM',
    features: FEATURES,
    requirements: {
      redis: isRedisRequired(),
      priceApis: arePriceApisRequired(),
      exchangeApis: areExchangeApisRequired(),
    },
  };
}
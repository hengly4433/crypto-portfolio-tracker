import { ExchangeClient, ExchangeAccountInfo, ExchangeBalance, ExchangeTrade, ExchangeOrder } from './exchange-client.interface';

export class BinanceClient implements ExchangeClient {
  private apiKey: string;
  private apiSecret: string;
  private isTestnet: boolean;

  constructor(apiKey: string, apiSecret: string, isTestnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isTestnet = isTestnet;
  }

  async getAccountInfo(): Promise<ExchangeAccountInfo> {
    // Mock implementation - in production, call Binance API
    console.log('Getting Binance account info...');
    
    // Simulate API call delay
    await this.simulateDelay();
    
    return {
      accountType: 'SPOT',
      permissions: ['SPOT'],
      canTrade: true,
      canWithdraw: false, // Read-only keys should not allow withdraw
      canDeposit: false,
      updateTime: new Date(),
    };
  }

  async getBalances(): Promise<ExchangeBalance[]> {
    console.log('Getting Binance balances...');
    
    await this.simulateDelay();
    
    // Mock balances
    return [
      { asset: 'BTC', free: 0.5, locked: 0.1, total: 0.6 },
      { asset: 'ETH', free: 5.0, locked: 0, total: 5.0 },
      { asset: 'USDT', free: 10000, locked: 500, total: 10500 },
      { asset: 'BNB', free: 2.5, locked: 0.5, total: 3.0 },
    ];
  }

  async getTrades(symbol?: string, startTime?: Date, endTime?: Date): Promise<ExchangeTrade[]> {
    console.log(`Getting Binance trades${symbol ? ` for ${symbol}` : ''}...`);
    
    await this.simulateDelay();
    
    // Mock trades
    const trades: ExchangeTrade[] = [
      {
        id: '123456789',
        symbol: 'BTCUSDT',
        side: 'BUY',
        price: 45000,
        quantity: 0.1,
        quoteQuantity: 4500,
        fee: 4.5,
        feeCurrency: 'USDT',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: '987654321',
        symbol: 'ETHUSDT',
        side: 'SELL',
        price: 3000,
        quantity: 2.0,
        quoteQuantity: 6000,
        fee: 6.0,
        feeCurrency: 'USDT',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
      },
    ];
    
    if (symbol) {
      return trades.filter(trade => trade.symbol === symbol);
    }
    
    return trades;
  }

  async getOpenOrders(symbol?: string): Promise<ExchangeOrder[]> {
    console.log(`Getting Binance open orders${symbol ? ` for ${symbol}` : ''}...`);
    
    await this.simulateDelay();
    
    // Mock open orders
    return [
      {
        id: '111222333',
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        price: 42000,
        quantity: 0.05,
        status: 'NEW',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ];
  }

  async testConnection(): Promise<boolean> {
    console.log('Testing Binance connection...');
    
    try {
      await this.simulateDelay();
      
      // In production, would make a simple API call like getting server time
      return true;
    } catch (error) {
      console.error('Binance connection test failed:', error);
      return false;
    }
  }

  /**
   * Simulate API delay (remove in production)
   */
  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Map Binance symbol to internal asset symbol
   */
  static mapSymbolToAsset(binanceSymbol: string): { base: string; quote: string } | null {
    // Examples: BTCUSDT -> BTC, USDT
    //           ETHBTC -> ETH, BTC
    
    // Common quote currencies
    const quoteCurrencies = ['USDT', 'BTC', 'ETH', 'BNB', 'USD', 'EUR'];
    
    for (const quote of quoteCurrencies) {
      if (binanceSymbol.endsWith(quote)) {
        const base = binanceSymbol.slice(0, -quote.length);
        return { base, quote };
      }
    }
    
    return null;
  }
}
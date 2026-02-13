import { ExchangeClient } from './exchange-client.interface';
import { BinanceClient } from './binance-client';
import { OkxClient } from './okx-client';

export class ExchangeClientFactory {
  /**
   * Create exchange client based on exchange code
   */
  static createClient(
    exchangeCode: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string,
    isTestnet: boolean = false
  ): ExchangeClient {
    switch (exchangeCode.toUpperCase()) {
      case 'BINANCE':
        return new BinanceClient(apiKey, apiSecret, isTestnet);
      case 'OKX':
        return new OkxClient(apiKey, apiSecret, passphrase, isTestnet);
      case 'COINBASE':
        // TODO: Implement Coinbase client
        throw new Error('Coinbase client not implemented yet');
      case 'KRAKEN':
        // TODO: Implement Kraken client
        throw new Error('Kraken client not implemented yet');
      case 'METAMASK':
        // TODO: Implement MetaMask wallet client
        throw new Error('MetaMask client not implemented yet');
      case 'UNISWAP':
        // TODO: Implement Uniswap DEX client
        throw new Error('Uniswap client not implemented yet');
      case 'IBKR':
        // TODO: Implement Interactive Brokers client
        throw new Error('Interactive Brokers client not implemented yet');
      default:
        throw new Error(`Unsupported exchange: ${exchangeCode}`);
    }
  }

  /**
   * Test exchange connection
   */
  static async testConnection(
    exchangeCode: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string
  ): Promise<boolean> {
    try {
      const client = this.createClient(exchangeCode, apiKey, apiSecret, passphrase);
      return await client.testConnection();
    } catch (error) {
      console.error(`Connection test failed for ${exchangeCode}:`, error);
      return false;
    }
  }

  /**
   * Get supported exchanges
   */
  static getSupportedExchanges(): string[] {
    return [
      'BINANCE',
      'OKX',
      'COINBASE',
      'KRAKEN',
      'METAMASK',
      'UNISWAP',
      'IBKR',
    ];
  }
}
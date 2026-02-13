"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeClientFactory = void 0;
const binance_client_1 = require("./binance-client");
const okx_client_1 = require("./okx-client");
class ExchangeClientFactory {
    /**
     * Create exchange client based on exchange code
     */
    static createClient(exchangeCode, apiKey, apiSecret, passphrase, isTestnet = false) {
        switch (exchangeCode.toUpperCase()) {
            case 'BINANCE':
                return new binance_client_1.BinanceClient(apiKey, apiSecret, isTestnet);
            case 'OKX':
                return new okx_client_1.OkxClient(apiKey, apiSecret, passphrase, isTestnet);
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
    static async testConnection(exchangeCode, apiKey, apiSecret, passphrase) {
        try {
            const client = this.createClient(exchangeCode, apiKey, apiSecret, passphrase);
            return await client.testConnection();
        }
        catch (error) {
            console.error(`Connection test failed for ${exchangeCode}:`, error);
            return false;
        }
    }
    /**
     * Get supported exchanges
     */
    static getSupportedExchanges() {
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
exports.ExchangeClientFactory = ExchangeClientFactory;

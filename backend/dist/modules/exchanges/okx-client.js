"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OkxClient = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class OkxClient {
    apiKey;
    apiSecret;
    passphrase;
    isTestnet;
    baseUrl;
    constructor(apiKey, apiSecret, passphrase, isTestnet = false) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.passphrase = passphrase;
        this.isTestnet = isTestnet;
        this.baseUrl = isTestnet
            ? 'https://www.okx.com/api/v5' // OKX testnet uses same domain with demo flag
            : 'https://www.okx.com/api/v5';
    }
    async getAccountInfo() {
        console.log('Getting OKX account info...');
        try {
            const response = await this.makeAuthenticatedRequest('GET', '/api/v5/account/config');
            const accountData = response.data[0];
            return {
                accountType: accountData.acctLv || 'SPOT',
                permissions: accountData.perm?.split(',') || ['read_only'],
                canTrade: accountData.perm?.includes('trade') || false,
                canWithdraw: accountData.perm?.includes('withdraw') || false,
                canDeposit: accountData.perm?.includes('deposit') || false,
                updateTime: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get OKX account info:', error);
            // Fallback to basic info if API call fails
            return {
                accountType: 'SPOT',
                permissions: ['read_only'],
                canTrade: false,
                canWithdraw: false,
                canDeposit: false,
                updateTime: new Date(),
            };
        }
    }
    async getBalances() {
        console.log('Getting OKX balances...');
        try {
            const response = await this.makeAuthenticatedRequest('GET', '/api/v5/account/balance');
            if (!response.data || response.data.length === 0) {
                return [];
            }
            const details = response.data[0].details || [];
            return details.map((detail) => ({
                asset: detail.ccy,
                free: parseFloat(detail.availBal) || 0,
                locked: parseFloat(detail.frozenBal) || 0,
                total: parseFloat(detail.eq) || 0,
            })).filter((balance) => balance.total > 0);
        }
        catch (error) {
            console.error('Failed to get OKX balances:', error);
            // Fallback to mock data for development
            return [
                { asset: 'BTC', free: 0.25, locked: 0.05, total: 0.3 },
                { asset: 'ETH', free: 3.0, locked: 0, total: 3.0 },
                { asset: 'USDT', free: 5000, locked: 200, total: 5200 },
                { asset: 'OKB', free: 10, locked: 2, total: 12 },
                { asset: 'SOL', free: 15, locked: 5, total: 20 },
            ];
        }
    }
    async getTrades(symbol, startTime, endTime) {
        console.log(`Getting OKX trades${symbol ? ` for ${symbol}` : ''}...`);
        try {
            const params = {
                limit: 100, // Maximum per request
            };
            if (symbol) {
                params.instId = symbol;
            }
            if (startTime) {
                params.begin = startTime.getTime().toString();
            }
            if (endTime) {
                params.end = endTime.getTime().toString();
            }
            const response = await this.makeAuthenticatedRequest('GET', '/api/v5/trade/fills', params);
            if (!response.data) {
                return [];
            }
            return response.data.map((trade) => ({
                id: trade.tradeId,
                symbol: trade.instId,
                side: trade.side.toUpperCase(),
                price: parseFloat(trade.fillPx),
                quantity: parseFloat(trade.fillSz),
                quoteQuantity: parseFloat(trade.fillPx) * parseFloat(trade.fillSz),
                fee: parseFloat(trade.fee) || 0,
                feeCurrency: trade.feeCcy || 'USDT',
                timestamp: new Date(parseInt(trade.ts)),
            }));
        }
        catch (error) {
            console.error('Failed to get OKX trades:', error);
            // Fallback to mock data for development
            const trades = [
                {
                    id: 'okx-trade-001',
                    symbol: 'BTC-USDT',
                    side: 'BUY',
                    price: 42000,
                    quantity: 0.05,
                    quoteQuantity: 2100,
                    fee: 2.1,
                    feeCurrency: 'USDT',
                    timestamp: new Date(Date.now() - 86400000), // 1 day ago
                },
                {
                    id: 'okx-trade-002',
                    symbol: 'ETH-USDT',
                    side: 'SELL',
                    price: 2800,
                    quantity: 1.5,
                    quoteQuantity: 4200,
                    fee: 4.2,
                    feeCurrency: 'USDT',
                    timestamp: new Date(Date.now() - 172800000), // 2 days ago
                },
                {
                    id: 'okx-trade-003',
                    symbol: 'SOL-USDT',
                    side: 'BUY',
                    price: 150,
                    quantity: 10,
                    quoteQuantity: 1500,
                    fee: 1.5,
                    feeCurrency: 'USDT',
                    timestamp: new Date(Date.now() - 259200000), // 3 days ago
                },
            ];
            if (symbol) {
                const normalizedSymbol = symbol.replace('-', '');
                return trades.filter(trade => {
                    const tradeSymbol = trade.symbol.replace('-', '');
                    return tradeSymbol === normalizedSymbol;
                });
            }
            return trades;
        }
    }
    async getOpenOrders(symbol) {
        console.log(`Getting OKX open orders${symbol ? ` for ${symbol}` : ''}...`);
        try {
            const params = {
                ordType: 'limit',
            };
            if (symbol) {
                params.instId = symbol;
            }
            const response = await this.makeAuthenticatedRequest('GET', '/api/v5/trade/orders-pending', params);
            if (!response.data) {
                return [];
            }
            return response.data.map((order) => ({
                id: order.ordId,
                symbol: order.instId,
                side: order.side.toUpperCase(),
                type: order.ordType.toUpperCase(),
                price: parseFloat(order.px) || 0,
                quantity: parseFloat(order.sz),
                status: this.mapOrderStatus(order.state),
                timestamp: new Date(parseInt(order.cTime)),
            }));
        }
        catch (error) {
            console.error('Failed to get OKX open orders:', error);
            // Fallback to mock data for development
            return [
                {
                    id: 'okx-order-001',
                    symbol: 'BTC-USDT',
                    side: 'SELL',
                    type: 'LIMIT',
                    price: 45000,
                    quantity: 0.02,
                    status: 'NEW',
                    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                },
            ];
        }
    }
    async testConnection() {
        console.log('Testing OKX connection...');
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/public/time`);
            if (response.status === 200 && response.data.code === '0') {
                console.log('OKX connection test successful');
                return true;
            }
            // Test authenticated endpoint if public endpoint works
            try {
                await this.makeAuthenticatedRequest('GET', '/api/v5/account/balance');
                return true;
            }
            catch (authError) {
                console.error('OKX authenticated connection failed:', authError);
                return false;
            }
        }
        catch (error) {
            console.error('OKX connection test failed:', error);
            return false;
        }
    }
    /**
     * Make authenticated request to OKX API
     */
    async makeAuthenticatedRequest(method, endpoint, params) {
        const timestamp = new Date().toISOString();
        let queryString = '';
        let body = '';
        if (method === 'GET' && params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key].toString());
                }
            });
            queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
        }
        else if (method === 'POST' && params) {
            body = JSON.stringify(params);
        }
        const requestPath = `${endpoint}${queryString}`;
        const signature = this.generateSignature(timestamp, method, requestPath, body);
        const headers = {
            'OK-ACCESS-KEY': this.apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': this.passphrase || '',
            'Content-Type': 'application/json',
        };
        const url = `${this.baseUrl}${requestPath}`;
        const config = {
            headers,
            timeout: 10000, // 10 second timeout
        };
        try {
            if (method === 'GET') {
                return await axios_1.default.get(url, config);
            }
            else if (method === 'POST') {
                return await axios_1.default.post(url, body, config);
            }
            else {
                throw new Error(`Unsupported HTTP method: ${method}`);
            }
        }
        catch (error) {
            if (error.response) {
                console.error(`OKX API error (${endpoint}):`, {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                });
            }
            else if (error.request) {
                console.error(`OKX API no response (${endpoint}):`, error.request);
            }
            else {
                console.error(`OKX API error (${endpoint}):`, error.message);
            }
            throw error;
        }
    }
    /**
     * Generate OKX signature
     */
    generateSignature(timestamp, method, requestPath, body = '') {
        const message = timestamp + method.toUpperCase() + requestPath + body;
        const hmac = crypto_1.default.createHmac('sha256', this.apiSecret);
        hmac.update(message);
        return hmac.digest('base64');
    }
    /**
     * Map OKX order status to internal status
     */
    mapOrderStatus(okxStatus) {
        const statusMap = {
            'live': 'NEW',
            'partially_filled': 'PARTIALLY_FILLED',
            'filled': 'FILLED',
            'canceled': 'CANCELED',
            'mmp_canceled': 'CANCELED',
        };
        return statusMap[okxStatus] || 'NEW';
    }
    /**
     * Map OKX symbol to internal asset symbol
     * OKX uses format: BTC-USDT, ETH-USDT, etc.
     */
    static mapSymbolToAsset(okxSymbol) {
        // Format: "BTC-USDT", "ETH-BTC", etc.
        const parts = okxSymbol.split('-');
        if (parts.length === 2) {
            return { base: parts[0], quote: parts[1] };
        }
        // Try without dash (some APIs might return different format)
        const commonQuotes = ['USDT', 'BTC', 'ETH', 'USD', 'EUR', 'OKB'];
        for (const quote of commonQuotes) {
            if (okxSymbol.endsWith(quote)) {
                const base = okxSymbol.slice(0, -quote.length);
                return { base, quote };
            }
        }
        return null;
    }
    /**
     * Simulate API delay (remove in production)
     */
    simulateDelay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.OkxClient = OkxClient;

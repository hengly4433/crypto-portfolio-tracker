export interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface ExchangeTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  quoteQuantity: number;
  fee: number;
  feeCurrency: string;
  timestamp: Date;
}

export interface ExchangeOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT';
  price?: number;
  quantity: number;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  timestamp: Date;
}

export interface ExchangeAccountInfo {
  accountType: string;
  permissions: string[];
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: Date;
}

export interface ExchangeClient {
  // Test connection and get account info
  getAccountInfo(): Promise<ExchangeAccountInfo>;
  
  // Get all balances
  getBalances(): Promise<ExchangeBalance[]>;
  
  // Get trades for a specific symbol or all symbols
  getTrades(symbol?: string, startTime?: Date, endTime?: Date): Promise<ExchangeTrade[]>;
  
  // Get open orders
  getOpenOrders(symbol?: string): Promise<ExchangeOrder[]>;
  
  // Test API key validity
  testConnection(): Promise<boolean>;
}
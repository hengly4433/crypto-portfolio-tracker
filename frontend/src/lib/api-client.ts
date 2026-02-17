/**
 * Typed API client for backend communication
 */

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:3001/api';
  if (envUrl.endsWith('/api')) return envUrl;
  return `${envUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// ─── Response Types ───────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Auth Types ───────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

// ─── Portfolio Types ──────────────────────────────────────────

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  baseCurrency: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields (optional as they may not be present on creation, but will be on fetch)
  totalValue?: number;
  totalUnrealizedPnl?: number;
  totalRealizedPnl?: number;
  snapshotTotalValue?: number;
}

export interface PositionSummary {
  assetId: string;
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  pnlPercent: number;
  weight: number;
}

export interface AllocationSlice {
  assetType: string;
  value: number;
  percentage: number;
}

export interface PerformancePoint {
  date: string;
  value: number;
  pnl: number;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  baseCurrency: string;
  totalValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: PositionSummary[];
  allocation: AllocationSlice[];
  performance: PerformancePoint[];
}

// ─── Transaction Types ────────────────────────────────────────

export type TransactionSide = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INCOME' | 'FEE';

export interface Transaction {
  id: string;
  portfolioId: string;
  assetId: string;
  side: TransactionSide;
  quantity: number;
  price: number;
  transactionCurrency: string;
  grossAmount: number;
  feeAmount: number;
  feeCurrency?: string;
  tradeTime: string;
  createdAt: string;
  note?: string;
  asset?: Asset;
  userAccountId?: string;
  type?: string;
  status?: string;
}

export interface CreateTransactionInput {
  assetId: string;
  side: TransactionSide;
  quantity: number;
  price: number;
  transactionCurrency: string;
  date: string;
  userAccountId?: string;
  feeAmount?: number;
  feeCurrency?: string;
  note?: string;
}

// ─── Asset Types ──────────────────────────────────────────────

export type AssetType = 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'FIAT';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  coingeckoId?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  isActive: boolean;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

export interface CreateAssetInput {
  symbol: string;
  name: string;
  coingeckoId: string;
  assetType?: AssetType;
}

// ─── Alert Types ──────────────────────────────────────────────

export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'PORTFOLIO_DRAWDOWN' | 'TARGET_PNL';

export interface Alert {
  id: string;
  userId: string;
  portfolioId?: string;
  assetId?: string;
  alertType: AlertType;
  targetPrice?: number;
  conditionValue: number;
  lookbackWindowMinutes?: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  asset?: Asset;
  portfolio?: Portfolio;
}

export interface CreateAlertInput {
  portfolioId?: string;
  assetId?: string;
  alertType: AlertType;
  targetPrice?: number;
  conditionValue: number;
  lookbackWindowMinutes?: number;
}

// ─── Exchange Types ───────────────────────────────────────────

export interface Exchange {
  id: string;
  name: string;
  code: string;
  type: string;
  websiteUrl?: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface UserAccount {
  id: string;
  userId: string;
  exchangeId: string;
  name: string;
  accountType: string;
  baseCurrency: string;
  isDefault: boolean;
  exchange?: Exchange;
}

// ─── Settings Types ───────────────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  baseCurrency: string;
  timezone: string;
  locale: string;
  darkMode: boolean;
}

// ─── API Client ───────────────────────────────────────────────

class ApiClient {
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (value: boolean) => void }> = [];

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Handle 401 with token refresh
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          const retryResponse = await fetch(url, { ...options, headers, credentials: 'include' });
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            return { error: retryData.message || `HTTP ${retryResponse.status}` };
          }
          return { data: retryData };
        }
        return { error: 'Session expired. Please login again.' };
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON (e.g. 404 HTML page), treat as error text
        const text = await response.text();
        return {
          error: `API Error: ${response.status} ${response.statusText}`,
          message: text.substring(0, 100) // truncate potentially long HTML
        };
      }

      if (!response.ok) {
        return {
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          message: data.message,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ─── Auth Methods ───────────────────────────────────────────

  async register(email: string, password: string, fullName?: string) {
    return this.request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshQueue.push({ resolve });
      });
    }

    this.isRefreshing = true;
    const refreshTokenValue = this.getRefreshToken();

    if (!refreshTokenValue) {
      this.isRefreshing = false;
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        this.clearTokens();
        this.resolveRefreshQueue(false);
        return false;
      }

      const tokens: AuthTokens = await response.json();
      this.setTokens(tokens);
      this.resolveRefreshQueue(true);
      return true;
    } catch {
      this.clearTokens();
      this.resolveRefreshQueue(false);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private resolveRefreshQueue(success: boolean) {
    this.refreshQueue.forEach(({ resolve }) => resolve(success));
    this.refreshQueue = [];
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
  }

  async getCurrentUser() {
    return this.request<User>('/users/me');
  }

  // ─── Portfolio Methods ──────────────────────────────────────

  async getPortfolios() {
    return this.request<Portfolio[]>('/portfolios');
  }

  async createPortfolio(name: string, baseCurrency = 'USD') {
    return this.request<Portfolio>('/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name, baseCurrency }),
    });
  }

  async getPortfolio(id: string) {
    return this.request<Portfolio>(`/portfolios/${id}`);
  }

  async updatePortfolio(id: string, data: { name?: string; baseCurrency?: string; description?: string }) {
    return this.request<Portfolio>(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePortfolio(id: string) {
    return this.request<void>(`/portfolios/${id}`, { method: 'DELETE' });
  }

  async getPortfolioSummary(id: string) {
    return this.request<PortfolioSummary>(`/portfolios/${id}/summary`);
  }

  async getPortfolioPerformance(id: string, days = 30) {
    return this.request<PerformancePoint[]>(`/portfolios/${id}/performance?days=${days}`);
  }

  async getTopPerformers(id: string, limit = 5) {
    return this.request<PositionSummary[]>(`/portfolios/${id}/top-performers?limit=${limit}`);
  }

  // ─── Transaction Methods ────────────────────────────────────

  async createTransaction(portfolioId: string, transaction: CreateTransactionInput) {
    return this.request<Transaction>(`/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getPortfolioTransactions(portfolioId: string, page = 1, limit = 50) {
    return this.request<PaginatedResponse<Transaction>>(`/portfolios/${portfolioId}/transactions?page=${page}&limit=${limit}`);
  }

  async deleteTransaction(portfolioId: string, transactionId: string) {
    return this.request<void>(`/portfolios/${portfolioId}/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // ─── Asset Methods ──────────────────────────────────────────

  async getAssets() {
    return this.request<Asset[]>('/assets');
  }

  async createAsset(asset: CreateAssetInput) {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  }

  async searchAssets(query: string) {
    return this.request<CoinSearchResult[]>(`/assets/search?query=${encodeURIComponent(query)}`);
  }

  // ─── Alert Methods ──────────────────────────────────────────

  async getAlerts() {
    return this.request<Alert[]>('/alerts');
  }

  async createAlert(alert: CreateAlertInput) {
    return this.request<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async updateAlert(id: string, data: Partial<CreateAlertInput> & { isActive?: boolean }) {
    return this.request<Alert>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(id: string) {
    return this.request<void>(`/alerts/${id}`, { method: 'DELETE' });
  }

  // ─── Exchange Methods ───────────────────────────────────────

  async getExchanges() {
    return this.request<Exchange[]>('/exchanges');
  }

  async getUserAccounts() {
    return this.request<UserAccount[]>('/exchanges/accounts');
  }

  // ─── Settings Methods ───────────────────────────────────────

  async getSettings() {
    return this.request<UserSettings>('/users/settings');
  }

  async updateSettings(data: Partial<UserSettings>) {
    return this.request<UserSettings>('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ─── Token Management ──────────────────────────────────────

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  setTokens(tokens: AuthTokens) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const apiClient = new ApiClient();
/**
 * API client for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

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

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
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

      const data = await response.json();

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

  // Auth methods
  async register(email: string, password: string, fullName?: string) {
    return this.request<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/users/me');
  }

  // Portfolio methods
  async getPortfolios() {
    return this.request<any[]>('/portfolios');
  }

  async createPortfolio(name: string, baseCurrency = 'USD') {
    return this.request<any>('/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name, baseCurrency }),
    });
  }

  async getPortfolio(id: string) {
    return this.request<any>(`/portfolios/${id}`);
  }

  async getPortfolioSummary(id: string) {
    return this.request<any>(`/portfolios/${id}/summary`);
  }

  async getPortfolioPerformance(id: string, days = 30) {
    return this.request<any>(`/portfolios/${id}/performance?days=${days}`);
  }

  async getTopPerformers(id: string, limit = 5) {
    return this.request<any>(`/portfolios/${id}/top-performers?limit=${limit}`);
  }

  // Transaction methods
  async createTransaction(
    portfolioId: string,
    transaction: {
      assetId: string;
      userAccountId: string;
      side: string;
      quantity: number;
      price: number;
      transactionCurrency: string;
      feeAmount?: number;
      feeCurrency?: string;
      tradeTime: string;
      note?: string;
    }
  ) {
    return this.request<any>(`/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getPortfolioTransactions(portfolioId: string) {
    return this.request<any[]>(`/portfolios/${portfolioId}/transactions`);
  }

  // Asset methods
  async getAssets() {
    return this.request<any[]>('/assets');
  }

  // Alert methods
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  async createAlert(alert: any) {
    return this.request<any>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  // Token management
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
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
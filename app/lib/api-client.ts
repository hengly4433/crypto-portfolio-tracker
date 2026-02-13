import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:3001/api'; // Change to your backend URL

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

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  totalValue?: number;
  totalUnrealizedPnl?: number;
  totalRealizedPnl?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from secure storage
    this.loadToken();

    // Add request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async loadToken() {
    try {
      this.token = await SecureStore.getItemAsync('access_token');
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  private async saveTokens(tokens: AuthTokens) {
    try {
      await SecureStore.setItemAsync('access_token', tokens.accessToken);
      await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
      this.token = tokens.accessToken;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private async clearTokens() {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      this.token = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Auth methods
  async register(email: string, password: string, fullName?: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response = await this.client.post('/auth/register', { email, password, fullName });
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      if (processedData.tokens) {
        await this.saveTokens(processedData.tokens);
      }
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      if (processedData.tokens) {
        await this.saveTokens(processedData.tokens);
      }
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get('/users/me');
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  // Portfolio methods
  async getPortfolios(): Promise<ApiResponse<Portfolio[]>> {
    try {
      const response = await this.client.get('/portfolios');
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  async createPortfolio(name: string, baseCurrency = 'USD'): Promise<ApiResponse<Portfolio>> {
    try {
      const response = await this.client.post('/portfolios', { name, baseCurrency });
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  async getPortfolio(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/portfolios/${id}`);
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  async getPortfolioSummary(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/portfolios/${id}/summary`);
      const data = response.data;
      
      // Handle BigInt serialization
      const processedData = JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return { data: processedData };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message,
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }
}

export const apiClient = new ApiClient();